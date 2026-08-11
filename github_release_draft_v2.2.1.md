# Release Notes: v2.2.1

## Tag: `v2.2.1`
## Release Title: `v2.2.1 - Multi-Factor Hardware Device Identification & Weekend Practice Chart Filtering`

We are pleased to announce the release of **v2.2.1** of the ECN Execution Trainer. This update introduces multi-factor composite hardware device identification prefixed with `v2-` to prevent device ID collisions across cloned Windows OS installations, alongside smart weekend practice chart filtering.

---

### 🚀 Key Features & Enhancements

#### 1. 🛡️ Multi-Factor Hardware Device ID Generation (`v2-`)
To resolve device ID collisions on systems cloned from identical Windows OS images or OEM batches:
* **Multi-Factor Fingerprinting**: Combines System UUID (`Win32_ComputerSystemProduct`), BIOS Serial (`Win32_BIOS`), Motherboard Serial (`Win32_BaseBoard`), Physical SSD Firmware Serial (`Win32_DiskDrive`), Windows `MachineGuid`, and a persistent local `.device_salt`.
* **Identifiable Prefix**: All generated device IDs are now prefixed with `v2-` (e.g., `v2-a1b2c3d4...`) for easy identification in Supabase and admin dashboards.
* **Network-Independent**: MAC addresses are excluded to ensure changing Wi-Fi, Ethernet, or VPN sources never changes the hardware identity.
* **Failsafe & Thread-Safe**: Sub-queries execute with `-ErrorAction SilentlyContinue` and fallback to `REG:<guid>` + local salt, cached in-memory via `OnceLock`.

#### 2. 📊 Practice Minutes Chart Weekend Hiding
* **Closed Market Filtering**: Automatically hides Saturday and Sunday from the 14-Day Practice Minutes bar chart when practice minutes on those days equal `0`.
* **Dynamic Display**: If practice occurs on a weekend (minutes > 0), the chart automatically displays Saturday or Sunday.

---

### 📦 Assets to Attach

Attach the newly generated release installer located in your build target folder:
* `ECN Execution Trainer_2.2.1_x64-setup.exe` (NSIS Installer)

---

### 🔑 Auto-Updater Metadata (`update.json`)

```json
{
  "version": "v2.2.1",
  "notes": "ECN Execution Trainer v2.2.1 Release - Features: Multi-Factor Composite Hardware Device ID (System UUID, BIOS, Motherboard, Physical SSD Firmware Serial & Persistent Salt) with v2- prefix to eliminate device collisions, and Practice Minutes weekend hiding for closed market days.",
  "pub_date": "2026-08-12T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVTeE1CZlliMGtlTkgySnFiRENhTHlJcFpvR0JxdWdDZ2FXTi92QlNHaUVUdGhScHJVKytJeHhoSGIzWTEyRWg4OE5OOVdZNjBNUUtUV1FBY3M0akd3OHFQbVBTRzdMRUFzPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzg2NDg5MTQwCWZpbGU6RUNOIEV4ZWN1dGlvbiBUcmFpbmVyXzIuMi4xX3g2NC1zZXR1cC5leGUKSXNrMTBsc3VxNnNZYUVFdWhZODdzOWllbjF4Q2JTRjdTNm44ZndNbnRuaUhxRms5Mi8vNmpMYTlBMElpUm9YT0V1WGNDK2NDTzB1TGZ1MGN1MTBvQ2c9PQo=",
      "url": "https://github.com/Web-Traveller/ecn-trainer/releases/download/v2.2.1/ECN.Execution.Trainer_2.2.1_x64-setup.exe"
    }
  }
}
```
