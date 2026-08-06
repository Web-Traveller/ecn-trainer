import { createClient } from '@supabase/supabase-js'

// ============================================================================
// SUPABASE CONFIGURATION
// Paste your Supabase credentials here. You can find them in your Supabase
// dashboard under Settings > API.
// ============================================================================
const SUPABASE_URL = 'https://tvjlahqfmjprgmntryea.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amxhaHFmbWpwcmdtbnRyeWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODU0MDYsImV4cCI6MjEwMTM2MTQwNn0.LcVbQjJx8JNqNGN_98AM3lzkf2w8DVpn7FOqMb89NKg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface AppConfig {
  id: number
  licensing_enabled: boolean
  latest_version: string
  force_update: boolean
  dev_trigger_word: string | null
  dev_passcode: string | null
}

export interface License {
  key: string
  max_devices: number
  expires_at: string | null
  is_active: boolean
  organization: string | null
}

export interface Device {
  device_id: string
  computer_name: string
  os: string
  license_key: string | null
  is_blocked: boolean
  first_seen: string
  last_seen: string
  allow_dev_mode?: boolean
  licenses?: License // Joined relation
}

/**
 * Fetches the global application configuration.
 */
export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Error fetching app config:', error)
      return null
    }
    return data as AppConfig
  } catch (err) {
    console.error('Unhandled error fetching app config:', err)
    return null
  }
}

/**
 * Checks if a device exists and retrieves its licensing/blocked status.
 */
export async function checkDevice(deviceId: string): Promise<Device | null> {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*, licenses(*)')
      .eq('device_id', deviceId)
      .maybeSingle()

    if (error) {
      console.error('Error checking device:', error)
      return null
    }
    return data as unknown as Device
  } catch (err) {
    console.error('Unhandled error checking device:', err)
    return null
  }
}

/**
 * Registers a new installation in the database.
 */
export async function registerDevice(
  deviceId: string,
  computerName: string,
  os: string
): Promise<Device | null> {
  try {
    const newDevice = {
      device_id: deviceId,
      computer_name: computerName,
      os,
      license_key: null,
      is_blocked: false,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('devices')
      .insert(newDevice)
      .select()
      .single()

    if (error) {
      console.error('Error registering device:', error)
      return null
    }
    return data as Device
  } catch (err) {
    console.error('Unhandled error registering device:', err)
    return null
  }
}

/**
 * Updates the last seen timestamp of the device to mark active status.
 */
export async function updateDeviceLastSeen(deviceId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_id', deviceId)

    if (error) {
      console.error('Error updating last seen timestamp:', error)
    }
  } catch (err) {
    console.error('Unhandled error updating last seen:', err)
  }
}

/**
 * Attempts to activate a license key on the current device.
 * Enforces expiration, active status, and seat limits.
 */
export async function activateLicense(
  deviceId: string,
  licenseKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanKey = licenseKey.trim()

    // 1. Fetch license details
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', cleanKey)
      .maybeSingle()

    if (licenseError || !license) {
      return { success: false, message: 'Invalid license key.' }
    }

    const typedLicense = license as License

    // 2. Verify if active
    if (!typedLicense.is_active) {
      return { success: false, message: 'This license has been deactivated.' }
    }

    // 3. Verify if expired
    if (typedLicense.expires_at) {
      const expiryDate = new Date(typedLicense.expires_at)
      if (expiryDate.getTime() < Date.now()) {
        return { success: false, message: 'This license has expired.' }
      }
    }

    // 4. Check device limit
    // Fetch how many active devices are registered to this key (excluding this device itself if it was already registered to it)
    const { count, error: countError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('license_key', cleanKey)
      .neq('device_id', deviceId)

    if (countError) {
      console.error('Error querying seat count:', countError)
      return { success: false, message: 'Error verifying seat count. Please try again.' }
    }

    const currentSeatsUsed = count || 0
    if (currentSeatsUsed >= typedLicense.max_devices) {
      return {
        success: false,
        message: `License seat limit exceeded. Max allowed devices: ${typedLicense.max_devices}`,
      }
    }

    // 5. Update device registration
    const { error: updateError } = await supabase
      .from('devices')
      .update({ license_key: cleanKey })
      .eq('device_id', deviceId)

    if (updateError) {
      console.error('Error associating license with device:', updateError)
      return { success: false, message: 'Failed to register license to this machine.' }
    }

    return { success: true, message: 'License activated successfully!' }
  } catch (err) {
    console.error('Unhandled error in activation:', err)
    return { success: false, message: 'An unexpected error occurred. Please try again.' }
  }
}
