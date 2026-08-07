import React from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { ECNGroupManager } from './ECNGroupManager';
import { useLicenseStore } from '../store/licenseStore';
import pkg from '../../package.json';

export const Settings: React.FC = () => {
  const { deviceId } = useLicenseStore();
  const appVersion = pkg.version;
  const {
    celebrationEffect,
    experimentalFeaturesEnabled,
    updateSettings,
    clearHistory
  } = useTrainerStore();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn font-mono">
      {/* Title */}
      <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold tracking-wider text-terminal-text uppercase">
            [SETTINGS_MANAGER] - TERMINAL CONFIGURATION
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
            Configure custom ECN groups, hotkey routes, and experimental features.
          </p>
        </div>
        <div className="flex flex-col text-left md:text-right font-mono text-[10px] text-terminal-muted border-t md:border-t-0 md:border-l border-terminal-border pt-2 md:pt-0 md:pl-4 self-stretch md:self-auto justify-center">
          <div>APP VERSION: <span className="text-terminal-text font-bold">{appVersion}</span></div>
          <div className="mt-1">DEVICE ID: <span className="text-terminal-text font-mono font-bold select-all bg-terminal-bg/50 px-1 border border-terminal-border/45 break-all">{deviceId || 'Not Initialized'}</span></div>
        </div>
      </div>

      {/* CUSTOM ECN & HOTKEY MANAGER */}
      <div className="bg-terminal-panel border border-terminal-border p-5">
        <ECNGroupManager />
      </div>

      {/* EXPERIMENTAL & BETA FEATURES */}
      <div className="bg-terminal-panel border border-terminal-border p-5 space-y-4">
        <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
          EXPERIMENTAL & BETA FEATURES
        </h3>

        <div className="flex justify-between items-center py-1">
          <div>
            <span className="text-xs text-terminal-text block font-bold">Enable Experimental & Beta Features</span>
            <span className="text-[10px] text-terminal-muted">Unlocks Flash Recall drill mode and custom celebration effects</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={experimentalFeaturesEnabled}
              onChange={(e) => updateSettings({ experimentalFeaturesEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
          </label>
        </div>

        {/* Celebration Style Selector (Revealed when Beta Features is ON) */}
        {experimentalFeaturesEnabled && (
          <div className="space-y-2 border-t border-terminal-border/40 pt-4 animate-fadeIn">
            <label className="text-[10px] text-terminal-muted uppercase block font-bold">
              Record-Break Celebration Style
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs font-bold font-mono">
              <button
                type="button"
                onClick={() => updateSettings({ celebrationEffect: 'money_rain' })}
                className={`py-2 px-3 border text-center transition-colors cursor-pointer ${
                  celebrationEffect === 'money_rain'
                    ? 'bg-success-green/20 border-success-green text-success-green'
                    : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:border-terminal-border'
                }`}
              >
                💸 Money Rain
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ celebrationEffect: 'confetti' })}
                className={`py-2 px-3 border text-center transition-colors cursor-pointer ${
                  celebrationEffect === 'confetti'
                    ? 'bg-success-green/20 border-success-green text-success-green'
                    : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:border-terminal-border'
                }`}
              >
                🎉 Confetti Burst
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DATA & TERMINAL RESET */}
      <div className="bg-terminal-panel border border-terminal-border p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs text-terminal-text block font-bold uppercase">SYSTEM STORAGE FLUSH</span>
          <span className="text-[10px] text-terminal-muted">Clear local session history and reset adaptive metrics</span>
        </div>
        <button
          onClick={() => {
            if (confirm('Flush historical trainer databases and ECN weights? This cannot be undone.')) {
              clearHistory();
            }
          }}
          className="px-4 py-2 bg-error-red/10 border border-error-red/30 hover:bg-error-red/20 text-error-red text-xs uppercase cursor-pointer font-bold transition-colors whitespace-nowrap"
        >
          Flush Local Storage History
        </button>
      </div>
    </div>
  );
};

export default Settings;
