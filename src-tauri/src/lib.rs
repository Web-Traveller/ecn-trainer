use std::fs;
use std::path::PathBuf;
use sha2::{Sha256, Digest};
use tauri::Manager;

fn get_state_file_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = app_handle.path().app_local_data_dir().map_err(|e| e.to_string())?;
  // Ensure directory exists
  if !path.exists() {
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
  }
  path.push(".licstate");
  Ok(path)
}

fn compute_timestamp_hash(timestamp: i64, machine_id: &str) -> String {
  let mut hasher = Sha256::new();
  let salt = "ecn-trainer-secure-salt-2026";
  let input = format!("{}:{}:{}", timestamp, machine_id, salt);
  hasher.update(input.as_bytes());
  format!("{:x}", hasher.finalize())
}

#[tauri::command]
fn get_hardware_uid() -> Result<String, String> {
  match machine_uid::get() {
    Ok(uid) => {
      let mut hasher = Sha256::new();
      hasher.update(uid.as_bytes());
      let result = hasher.finalize();
      Ok(format!("{:x}", result))
    }
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
fn get_system_info() -> Result<(String, String), String> {
  let hostname = whoami::fallible::hostname().unwrap_or_else(|_| "Unknown".to_string());
  let os = format!("{}", whoami::platform());
  Ok((hostname, os))
}

#[tauri::command]
fn read_secure_timestamp(app_handle: tauri::AppHandle) -> Result<Option<i64>, String> {
  let path = get_state_file_path(&app_handle)?;
  if !path.exists() {
    return Ok(None);
  }
  let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
  let parts: Vec<&str> = content.trim().split(':').collect();
  if parts.len() != 2 {
    return Err("Invalid state format".to_string());
  }
  let timestamp_str = parts[0];
  let hash_received = parts[1];

  let timestamp: i64 = timestamp_str.parse().map_err(|_| "Invalid timestamp".to_string())?;
  
  // Get machine ID to verify the hash
  let machine_id = machine_uid::get().unwrap_or_else(|_| "default_id".to_string());
  let expected_hash = compute_timestamp_hash(timestamp, &machine_id);

  if hash_received == expected_hash {
    Ok(Some(timestamp))
  } else {
    Err("Integrity check failed. License state altered.".to_string())
  }
}

#[tauri::command]
fn write_secure_timestamp(app_handle: tauri::AppHandle, timestamp: i64) -> Result<(), String> {
  let path = get_state_file_path(&app_handle)?;
  let machine_id = machine_uid::get().unwrap_or_else(|_| "default_id".to_string());
  let hash = compute_timestamp_hash(timestamp, &machine_id);
  let content = format!("{}:{}", timestamp, hash);
  fs::write(path, content).map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    std::process::Command::new("cmd")
      .args(["/C", "start", &url])
      .spawn()
      .map_err(|e| e.to_string())?;
  }
  #[cfg(not(target_os = "windows"))]
  {
    let cmd = if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
    std::process::Command::new(cmd)
      .arg(&url)
      .spawn()
      .map_err(|e| e.to_string())?;
  }
  Ok(())
}

fn get_sessions_file_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
  let mut path = app_handle.path().app_local_data_dir().map_err(|e| e.to_string())?;
  if !path.exists() {
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
  }
  path.push("sessions.json");
  Ok(path)
}

fn compute_sessions_hash(json_data: &str, machine_id: &str) -> String {
  let mut hasher = Sha256::new();
  let salt = "ecn-sessions-integrity-salt-2026";
  let input = format!("{}:{}:{}", json_data, machine_id, salt);
  hasher.update(input.as_bytes());
  format!("{:x}", hasher.finalize())
}

#[tauri::command]
fn save_sessions_to_file(app_handle: tauri::AppHandle, json_data: String) -> Result<(), String> {
  let path = get_sessions_file_path(&app_handle)?;
  
  // 1. Rolling Backup: If valid sessions.json exists, copy to sessions.json.bak
  if path.exists() {
    if let Ok(existing_content) = fs::read_to_string(&path) {
      if !existing_content.trim().is_empty() {
        let mut bak_path = path.clone();
        bak_path.set_file_name("sessions.json.bak");
        let _ = fs::write(bak_path, existing_content);
      }
    }
  }

  // 2. Write new sessions.json
  fs::write(&path, &json_data).map_err(|e| e.to_string())?;

  // 3. Compute and write integrity signature
  let machine_id = machine_uid::get().unwrap_or_else(|_| "default_id".to_string());
  let sig = compute_sessions_hash(&json_data, &machine_id);
  let mut sig_path = path.clone();
  sig_path.set_file_name("sessions.json.sig");
  let _ = fs::write(sig_path, sig);

  Ok(())
}

#[tauri::command]
fn load_sessions_from_file(app_handle: tauri::AppHandle) -> Result<String, String> {
  let path = get_sessions_file_path(&app_handle)?;
  
  let target_path = if !path.exists() {
    // Try backup file if main file is missing
    let mut bak_path = path.clone();
    bak_path.set_file_name("sessions.json.bak");
    if bak_path.exists() {
      bak_path
    } else {
      return Ok("[]".to_string());
    }
  } else {
    path.clone()
  };

  let content = fs::read_to_string(&target_path).map_err(|e| e.to_string())?;
  if content.trim().is_empty() {
    return Ok("[]".to_string());
  }

  // Verify integrity signature if present
  let machine_id = machine_uid::get().unwrap_or_else(|_| "default_id".to_string());
  let expected_sig = compute_sessions_hash(&content, &machine_id);
  let mut sig_path = path.clone();
  sig_path.set_file_name("sessions.json.sig");

  if sig_path.exists() {
    if let Ok(actual_sig) = fs::read_to_string(sig_path) {
      if actual_sig.trim() != expected_sig {
        eprintln!("[INTEGRITY WARNING] sessions.json content was modified or signature mismatch!");
      }
    }
  }

  Ok(content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_hardware_uid,
      get_system_info,
      read_secure_timestamp,
      write_secure_timestamp,
      open_external_url,
      save_sessions_to_file,
      load_sessions_from_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

