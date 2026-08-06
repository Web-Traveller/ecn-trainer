# Release Notes: v2.1.1

## Tag: `v2.1.1`
## Release Title: `v2.1.1 - Silent background updates & Time Gap Injector`

We are pleased to announce the release of **v2.1.1** of the ECN Execution Trainer. This update introduces seamless background updates and a hidden administrative gap auditing console.

---

### 🚀 Key Features & Enhancements

#### 1. 🔄 Completely Silent Background Auto-Updater
We have redesigned the auto-update mechanism to run programmatically on application boot:
* **Zero Interruption**: The application silently queries, downloads, and stages updates in the background without launching native window prompts.
* **Seamless Apply**: Staged updates are installed automatically when the user next closes and restarts the trainer app.

#### 2. ⚡ Hidden Administrative Gap Injector Console
A hidden console has been added to support manual timelines auditing and gap filling directly at a desk:
* **Trigger Sequence**: Type **`mock`** sequentially on the keyboard (case-insensitive) when not focused on a text input.
* **Passcode Protected**: Unlocks with secure passcode **`2026`**.
* **Smart Time-Gap filling**: Automatically identifies timeline gaps > 2 minutes and offers multiple target duration options (e.g. 5m, 10m, 15m, 20m, 30m, and Fill Max).
* **Multi-Session Chaining**: Automatically chains human-paced mock runs (25, 50, 100, 150, or 200 prompts) inside the gap separated by equal break times, matching the speed/accuracy profile of surrounding runs.

#### 3. 🖥️ Consolidated Diagnostics Header
We moved the `APP VERSION` and `DEVICE ID` indicators directly into the top **[SETTINGS_MANAGER] - TERMINAL & ROUTING CONFIGURATION** banner to keep the settings board clean and compact.

---

### 📦 Assets to Attach

Attach the newly generated release installers located in your build target folders:
* `ECN Execution Trainer_2.1.1_x64-setup.exe` (NSIS Installer)
* `ECN Execution Trainer_2.1.1_x64_en-US.msi` (MSI Installer)

---

### 🔑 Auto-Updater Metadata

If you are using Tauri's auto-updater endpoint, configure your server's `update.json` file with this signature:

```json
{
  "version": "2.1.1",
  "notes": "Silent Gap-Filler Console features implemented",
  "pub_date": "2026-08-05T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVTeE1CZlliMGtlTkxFNCtCcnAweUZvMnREbjRWVzF1T3VoS2JTM3M3aXdLVDByOTE5dm9jOEhNdkNYQXo0RFRoZ1gweW1KZU9iVEd4SG5xZElSMk1lSFBxWDNiNjcrMHdFPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg1ODg2ODM0CWZpbGU6RUNOIEV4ZWN1dGlvbiBUcmFpbmVyXzIuMS4xX3g2NC1zZXR1cC5leGUKVlNuSi9FTUJoSFpnQXFLNm5MNG1hR1UwYTNJWHNQNEhlYjlvT2YxTXcwQVZwZVQ3VitZem1QUFo5T2VDQ01mc2w4ZjIyMjNVa3VPWmFpUm1hYktJQ3c9PQo=",
      "url": "https://tvjlahqfmjprgmntryea.supabase.co/storage/v1/object/public/releases/ECN%20Execution%20Trainer_2.1.1_x64-setup.exe"
    }
  }
}
```
