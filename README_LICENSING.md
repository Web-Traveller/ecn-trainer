# ECN Trainer Licensing & Auto-Update Guide

This guide details the step-by-step instructions for managing devices, licenses, and deploying auto-updates using your **Supabase** backend and **Tauri v2** desktop compiler.

---

## 🛠️ Step 1: First-Time Database Setup

To hook your application up to the live license manager, configure the database:

1.  **Create your Supabase Database**:
    *   Sign in to [Supabase](https://supabase.com) and create a free project.
    *   Go to **SQL Editor** (left navigation bar) > click **New query**.
    *   Copy and paste the SQL script from `implementation_plan.md` into the editor and click **Run**. This will create the `app_config`, `licenses`, and `devices` tables with all access policies automatically.

2.  **Paste your API Credentials**:
    *   In Supabase, go to **Project Settings > API**.
    *   Copy the **Project URL** and the **anon public key**.
    *   Open `src/services/supabase.ts` and paste them into lines 8 and 9:
        ```typescript
        const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
        const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY'
        ```

3.  **Create your public Storage Bucket**:
    *   Go to **Storage** (left navigation bar) > click **New Bucket**.
    *   Name the bucket exactly **`releases`**.
    *   Make sure to toggle **Public bucket** to **ON** (this allows the app to fetch update files without requiring user login credentials).

4.  **Create your first License Keys**:
    *   Go to **Table Editor > licenses** table.
    *   Click **Insert Row** to generate keys.
    *   Example row:
        *   `key`: `ECN-ALPHA-2026`
        *   `max_devices`: `3` (allows this key to be shared on up to 3 PCs)
        *   `is_active`: `true`
        *   `organization`: `Alpha Traders`

---

## ⚙️ Step 2: Everyday Remote Admin Controls (Your Admin Panel)

Because we kept the system simple, you can manage everything directly inside the **Supabase Table Editor** spreadsheet interface:

*   **Turn on Licensing Globally**:
    *   Go to `app_config` table. Edit the single row and set `licensing_enabled = true`.
    *   *Result*: The next time any user opens the app, it will instantly lock the trainer and request their license activation key. (Toggle it back to `false` to revert to free Open Mode).
*   **Block/Deactivate a Device**:
    *   Go to the `devices` table.
    *   Identify the machine you want to block (you can search by `computer_name` or check `last_seen` timestamps).
    *   Toggle `is_blocked` to `true`.
    *   *Result*: That specific machine will immediately unmount the trainer on their next startup/heartbeat and show the "Device Deactivated" lock screen.
*   **Revoke a License Key**:
    *   Go to `licenses` table.
    *   Set `is_active = false` or change the `expires_at` date to the past.
    *   *Result*: All machines registered to that key will lock down.

---

## 🔄 Step 3: Pushing a New Software Update (Next Time)

When you fix a bug, change code, or want to release a new version of the ECN Trainer, follow these steps:

### 1. Generate your Signing Key (Once Only)
If you haven't generated an update signing key pair yet, run:
```bash
npx tauri signer generate
```
Save the private key text securely on your computer. Copy the public key text and paste it into `src-tauri/tauri.conf.json`:
```json
"plugins": {
  "updater": {
    "pubkey": "YOUR_PUBLIC_KEY_STRING_HERE"
  }
}
```

### 2. Prepare the Code & Build
1. Increment the version number in **three** files:
   * `package.json` (e.g., `"version": "2.2.0"`)
   * `src-tauri/tauri.conf.json` (e.g., `"version": "2.2.0"`)
   * `src/store/licenseStore.ts` (e.g., `const APP_VERSION = '2.2.0'`)
2. Build the production package. Set your private key as an environment variable in your terminal, then run:
   ```bash
   # In Windows PowerShell:
   $env:TAURI_SIGNING_PRIVATE_KEY="your-private-key-contents"
   npm run tauri:build
   ```
3. Locate the compiled update zip in your project directory:
   `src-tauri/target/release/bundle/updater/ECN Execution Trainer_2.2.0_x64_en-US.msi.zip`
4. Locate the corresponding signature in the `.sig` file in the same folder.

### 3. Upload to Supabase Storage
1. Go to your Supabase project **Storage > `releases`** bucket.
2. Upload the built `.zip` file.
3. Click on the uploaded zip file and copy its **Public URL** (e.g. `https://xxxx.supabase.co/storage/v1/object/public/releases/ECN_Trainer_2.2.0.zip`).

### 4. Update the `update.json` config
1. Create or edit a local file called `update.json`.
2. Fill it with the new version details, the copied signature text, and the copied public URL:
   ```json
   {
     "version": "2.2.0",
     "notes": "Version 2.2.0: Core training performance improvements.",
     "pub_date": "2026-08-04T12:00:00Z",
     "platforms": {
       "windows-x86_64": {
         "signature": "PASTE_THE_SIGNATURE_STRING_FROM_THE_SIG_FILE",
         "url": "https://xxxx.supabase.co/storage/v1/object/public/releases/ECN_Trainer_2.2.0.zip"
       }
     }
   }
   ```
3. Upload `update.json` to your Supabase `releases` storage bucket, overwriting the old one.
4. (Optional) If you want to force all users to update immediately, go to the `app_config` table in Supabase and change `latest_version` to `2.2.0` and `force_update` to `true`.
