import React, { useState } from 'react'
import { useLicenseStore } from '../store/licenseStore'

export const LicensingOverlay: React.FC = () => {
  const {
    state,
    licenseExpiry,
    organization,
    errorMessage,
    appVersion,
    latestVersion,
    activateKey,
    initialize,
  } = useLicenseStore()

  const [inputKey, setInputKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputKey.trim()) return

    setActivating(true)
    setMessage(null)
    const result = await activateKey(inputKey)
    setActivating(false)

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  // If the state is 'open', we don't block the screen
  if (state === 'open') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-terminal-bg/90 backdrop-blur-sm select-none text-terminal-text font-mono">
      <div className="relative w-full max-w-md bg-terminal-panel border border-terminal-border p-8 shadow-2xl font-mono">
        
        {/* Header Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-terminal-border" />

        {/* 1. CHECKING STATE */}
        {state === 'checking' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="h-10 w-10 animate-spin text-info-blue"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <h2 className="mt-6 text-sm font-bold tracking-wider text-terminal-text uppercase">
              [SYS] VERIFYING TERMINAL STATE...
            </h2>
            <p className="mt-2 text-xs text-terminal-muted">
              Checking database credentials & license verification.
            </p>
          </div>
        )}

        {/* 2. BLOCKED STATE */}
        {state === 'blocked' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center bg-error-red/10 text-error-red border border-error-red/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-sm font-bold tracking-wider text-error-red uppercase">
              [ACCESS_DENIED] DEVICE DEACTIVATED
            </h2>
            <p className="text-terminal-text text-xs leading-relaxed">
              This terminal hardware ID has been suspended. Contact your trading administrator or desk operations for reactivation.
            </p>
            <div className="w-full mt-6 text-[10px] text-terminal-muted bg-terminal-bg/50 px-4 py-2 border border-terminal-border">
              CLIENT VERSION: {appVersion}
            </div>
          </div>
        )}

        {/* 3. OFFLINE BLOCKED STATE */}
        {state === 'offline_blocked' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center bg-warning-amber/10 text-warning-amber border border-warning-amber/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 5.25-1.91m0 0v16.273m-5.25-14.363 5.25-1.91m0 0 6 2.182M12.75 13.636h3.75m-3.75 3h3.75" />
              </svg>
            </div>
            <h2 className="text-sm font-bold tracking-wider text-warning-amber uppercase">
              [NET_OFFLINE] SYSTEM HANDSHAKE REQUIRED
            </h2>
            <p className="text-terminal-text text-xs leading-relaxed">
              {errorMessage || 'Offline grace period exceeded. Please connect to the internet to verify licensing.'}
            </p>
            
            <button
              onClick={() => initialize()}
              className="mt-6 w-full cursor-pointer bg-warning-amber border border-warning-amber hover:bg-warning-amber/80 text-terminal-bg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              [RETRY_HANDSHAKE]
            </button>
          </div>
        )}

        {/* 4. UPDATE REQUIRED STATE */}
        {state === 'update_required' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center bg-info-blue/10 text-info-blue border border-info-blue/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6 animate-bounce">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h2 className="text-sm font-bold tracking-wider text-info-blue uppercase">
              [SYS_UPDATE] VERSION DEPRECIATED
            </h2>
            <p className="text-terminal-text text-xs leading-relaxed">
              Terminal version <strong className="text-white">{appVersion}</strong> is deprecated. A critical software update is required to match current APIs. Please install version <strong className="text-info-blue">{latestVersion}</strong>.
            </p>
            <p className="text-[10px] text-terminal-muted leading-relaxed">
              Updates will download automatically in the background. Please close and reopen your application to apply.
            </p>
          </div>
        )}

        {/* 5. LICENSE KEY REQUIRED / EXPIRED */}
        {(state === 'license_required' || state === 'expired') && (
          <div className="flex flex-col">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center bg-info-blue/10 text-info-blue border border-info-blue/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
              </div>
              
              {state === 'expired' ? (
                <>
                  <h2 className="text-sm font-bold tracking-wider text-error-red uppercase">
                    [LIC_EXPIRED] LICENSE EXPIRED
                  </h2>
                  <p className="text-terminal-text text-xs leading-relaxed">
                    The registration for <strong className="text-white">{organization || 'your organization'}</strong> expired on {licenseExpiry && new Date(licenseExpiry).toLocaleDateString()}. Input a renewal license key to unlock.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-sm font-bold tracking-wider text-info-blue uppercase">
                    [LIC_REQUIRED] ACTIVATE LICENSE
                  </h2>
                  <p className="text-terminal-text text-xs leading-relaxed">
                    This terminal is in licensing mode. Provide a valid activation key to register this device.
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleActivate} className="mt-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-terminal-muted">
                  License Activation Key
                </label>
                <input
                  type="text"
                  placeholder="ECN-XXXX-XXXX-XXXX"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="mt-2 w-full border border-terminal-border bg-terminal-bg px-4 py-2.5 text-center text-terminal-text placeholder-terminal-muted/40 outline-none transition-colors focus:border-info-blue font-mono text-xs uppercase"
                  disabled={activating}
                />
              </div>

              {message && (
                <div
                  className={`border px-4 py-2 text-xs leading-relaxed ${
                    message.type === 'success'
                      ? 'border-success-green/30 bg-success-green/10 text-success-green'
                      : 'border-error-red/30 bg-error-red/10 text-error-red'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {errorMessage && !message && (
                <div className="border border-error-red/30 bg-error-red/10 px-4 py-2 text-xs text-error-red leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={activating || !inputKey.trim()}
                className="w-full cursor-pointer bg-info-blue border border-info-blue hover:bg-info-blue/80 text-white py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:bg-terminal-border/20 disabled:text-terminal-muted disabled:border-terminal-border"
              >
                {activating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Validating...
                  </span>
                ) : (
                  'Submit Activation'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
