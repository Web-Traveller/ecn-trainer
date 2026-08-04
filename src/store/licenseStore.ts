import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import {
  fetchAppConfig,
  checkDevice,
  registerDevice,
  updateDeviceLastSeen,
  activateLicense,
} from '../services/supabase'

export type LicenseState =
  | 'checking'
  | 'open'
  | 'license_required'
  | 'blocked'
  | 'expired'
  | 'offline_blocked'
  | 'update_required'

interface LicenseStore {
  state: LicenseState
  deviceId: string | null
  computerName: string | null
  os: string | null
  appVersion: string
  latestVersion: string | null
  licenseKey: string | null
  organization: string | null
  errorMessage: string | null
  licenseExpiry: string | null
  
  initialize: () => Promise<void>
  activateKey: (key: string) => Promise<{ success: boolean; message: string }>
  checkUpdateStatus: () => Promise<void>
}

const APP_VERSION = '2.1.0' // Matches version in tauri.conf.json
const OFFLINE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export const useLicenseStore = create<LicenseStore>((set, get) => {
  // Read cached status on boot to determine startup state without showing any loading spinner
  const cachedStatus = localStorage.getItem('ecn_license_status') as LicenseState || 'open'

  const setAndCacheState = (newState: LicenseState, additionalData = {}) => {
    localStorage.setItem('ecn_license_status', newState)
    set({ state: newState, ...additionalData })
  }

  return {
    state: cachedStatus === 'checking' ? 'open' : cachedStatus,
    deviceId: null,
    computerName: null,
    os: null,
    appVersion: APP_VERSION,
    latestVersion: null,
    licenseKey: null,
    organization: null,
    errorMessage: null,
    licenseExpiry: null,

    initialize: async () => {
      // Run silently in background without showing "checking..." spinner to the user
      set({ errorMessage: null })

      let deviceId: string
      let computerName = 'Unknown'
      let os = 'Unknown'

      // 1. Get Hardware Info via Rust
      try {
        deviceId = await invoke<string>('get_hardware_uid')
        const [host, platform] = await invoke<[string, string]>('get_system_info')
        computerName = host
        os = platform
        set({ deviceId, computerName, os })
      } catch (err) {
        console.error('Failed to retrieve system hardware info:', err)
        // Fallback: Generate local persistent UUID if machine-uid fails
        let localUuid = localStorage.getItem('ecn_device_uuid')
        if (!localUuid) {
          localUuid = crypto.randomUUID()
          localStorage.setItem('ecn_device_uuid', localUuid)
        }
        deviceId = localUuid
        set({ deviceId })
      }

      // 2. Perform Network Check & Database Handshake
      try {
        const config = await fetchAppConfig()

        if (config) {
          // ONLINE MODE
          set({ latestVersion: config.latest_version })

          // Check if device is registered
          let device = await checkDevice(deviceId)
          if (!device) {
            device = await registerDevice(deviceId, computerName, os)
          } else {
            // Update details if they changed (e.g. computer name or OS update) and bump last_seen
            await updateDeviceLastSeen(deviceId)
          }

          // Write the current timestamp to Rust secure local storage to reset the 7-day offline clock
          try {
            await invoke('write_secure_timestamp', { timestamp: Date.now() })
          } catch (err) {
            console.error('Failed to write secure timestamp:', err)
          }

          // Evaluate state
          if (device?.is_blocked) {
            setAndCacheState('blocked')
            return
          }

          // Check if forced update is required
          if (config.force_update && APP_VERSION !== config.latest_version) {
            setAndCacheState('update_required')
            return
          }

          // Licensing Check
          if (config.licensing_enabled) {
            if (device?.license_key && device.licenses) {
              const license = device.licenses
              // Check expiry
              if (license.expires_at) {
                const expiryTime = new Date(license.expires_at).getTime()
                if (expiryTime < Date.now()) {
                  setAndCacheState('expired', {
                    licenseKey: device.license_key,
                    licenseExpiry: license.expires_at,
                    organization: license.organization,
                  })
                  return
                }
              }

              if (!license.is_active) {
                setAndCacheState('license_required', { errorMessage: 'License key is deactivated.' })
                return
              }

              // Valid license online! Save cached states in localStorage for offline boots
              localStorage.setItem('ecn_license_key', device.license_key)
              localStorage.setItem('ecn_license_org', license.organization || '')
              localStorage.setItem('ecn_license_expiry', license.expires_at || '')

              setAndCacheState('open', {
                licenseKey: device.license_key,
                licenseExpiry: license.expires_at,
                organization: license.organization,
              })
            } else {
              // No license key associated with this device
              setAndCacheState('license_required')
            }
          } else {
            // Open Mode (Licensing Disabled globally)
            setAndCacheState('open')
          }
          return
        }
      } catch (err) {
        console.warn('Network issue. App starting in offline mode.', err)
      }

      // 3. OFFLINE FALLBACK MODE
      // Retrieve secure timestamp from Rust to check the 7-day limit
      try {
        const lastCheckIn = await invoke<number | null>('read_secure_timestamp')

        if (lastCheckIn === null) {
          // App has never successfully completed an online handshake
          // We write the current time to start their first 7-day trial period
          const now = Date.now()
          await invoke('write_secure_timestamp', { timestamp: now })
          setAndCacheState('open') // Allow them to use it initially
        } else {
          const now = Date.now()

          // Time-tampering check: system clock moved backwards
          if (now < lastCheckIn) {
            setAndCacheState('offline_blocked', {
              errorMessage: 'Time-tampering detected. Please correct your system clock and connect to the internet.',
            })
            return
          }

          // Grace period check
          if (now - lastCheckIn > OFFLINE_LIMIT_MS) {
            setAndCacheState('offline_blocked', {
              errorMessage: 'Offline grace period exceeded. Please connect to the internet to verify your license.',
            })
            return
          }

          // Within grace period. Use cached licensing state from localStorage
          const cachedKey = localStorage.getItem('ecn_license_key')
          const cachedOrg = localStorage.getItem('ecn_license_org')
          const cachedExpiry = localStorage.getItem('ecn_license_expiry')

          // If a license key was previously required and active, check if it was cached
          // Note: If licensing was disabled last time, we allow offline boot
          setAndCacheState('open', {
            licenseKey: cachedKey,
            organization: cachedOrg,
            licenseExpiry: cachedExpiry || null,
          })
        }
      } catch (err) {
        console.error('Offline license check failed:', err)
        setAndCacheState('offline_blocked', {
          errorMessage: 'Security integrity error. Please check your internet connection.',
        })
      }
    },

    activateKey: async (key: string) => {
      const { deviceId } = get()
      if (!deviceId) {
        return { success: false, message: 'Device ID is not initialized yet.' }
      }

      setAndCacheState('checking', { errorMessage: null })
      const res = await activateLicense(deviceId, key)

      if (res.success) {
        // Re-trigger initialize to reload license properties and configuration from database
        await get().initialize()
        return { success: true, message: res.message }
      } else {
        setAndCacheState('license_required', { errorMessage: res.message })
        return { success: false, message: res.message }
      }
    },

    checkUpdateStatus: async () => {
      try {
        const config = await fetchAppConfig()
        if (config) {
          set({ latestVersion: config.latest_version })
          if (config.force_update && APP_VERSION !== config.latest_version) {
            setAndCacheState('update_required')
          }
        }
      } catch (err) {
        console.error('Failed to check updates online:', err)
      }
    },
  }
})
