import React from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { ECNGroupManager } from './ECNGroupManager';
import { getAllEcns } from '../core/learning';

export const Settings: React.FC = () => {
  const {
    submissionMethod,
    cancelMethod,
    smartLearningEnabled,
    sessionLength,
    priceTrainingEnabled,
    priceRangeMode,
    minPriceAdjustment,
    maxPriceAdjustment,
    trackResets,
    trackOvershoots,
    trackRecoveries,
    practiceModeType,
    adaptivePacingEnabled,
    feedbackDelayMs,
    initialTimeLimitMs,
    targetEcnModeEnabled,
    targetEcns,
    routingConfig,
    updateSettings,
    clearHistory
  } = useTrainerStore();

  const activeEcns = getAllEcns(routingConfig.groups);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn font-mono">
      {/* Title */}
      <div className="bg-terminal-panel border border-terminal-border p-4">
        <h2 className="text-base font-bold tracking-wider text-terminal-text uppercase">
          [SETTINGS_MANAGER] - TERMINAL & ROUTING CONFIGURATION
        </h2>
        <p className="text-xs text-terminal-muted mt-0.5">
          Configure custom ECN groups, hotkeys, price movement ranges, and training defaults.
        </p>
      </div>

      {/* CUSTOM ECN & HOTKEY MANAGER */}
      <div className="bg-terminal-panel border border-terminal-border p-5">
        <ECNGroupManager />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: General, Training, Analytics */}
        <div className="lg:col-span-6 space-y-6">
          {/* GENERAL SETTINGS */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              GENERAL SETTINGS
            </h3>

            <div className="space-y-4">
              {/* Submission Method */}
              <div>
                <span className="text-[10px] text-terminal-muted uppercase block mb-1">
                  Submission Mode
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-terminal-text cursor-pointer">
                    <input
                      type="radio"
                      name="subMethod"
                      checked={submissionMethod === 'Enter'}
                      onChange={() => updateSettings({ submissionMethod: 'Enter' })}
                      className="accent-info-blue"
                    />
                    Enter
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-terminal-text cursor-pointer">
                    <input
                      type="radio"
                      name="subMethod"
                      checked={submissionMethod === 'ShiftEnter'}
                      onChange={() => updateSettings({ submissionMethod: 'ShiftEnter' })}
                      className="accent-info-blue"
                    />
                    Shift + Enter
                  </label>
                </div>
              </div>

              {/* Cancel Method */}
              <div>
                <span className="text-[10px] text-terminal-muted uppercase block mb-1">
                  Clear/Cancel Mode
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-terminal-text cursor-pointer">
                    <input
                      type="radio"
                      name="cancelMethod"
                      checked={cancelMethod === 'Escape'}
                      onChange={() => updateSettings({ cancelMethod: 'Escape' })}
                      className="accent-info-blue"
                    />
                    Escape
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-terminal-text cursor-pointer">
                    <input
                      type="radio"
                      name="cancelMethod"
                      checked={cancelMethod === 'ShiftEscape'}
                      onChange={() => updateSettings({ cancelMethod: 'ShiftEscape' })}
                      className="accent-info-blue"
                    />
                    Shift + Escape
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* PRICE TRAINING CONFIGURATION */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide flex justify-between items-center">
              <span>PRICE TRAINING CONFIGURATION</span>
              {priceTrainingEnabled && (
                <span className="text-[10px] text-info-blue bg-info-blue/10 border border-info-blue/30 px-2 py-0.5 font-normal">
                  Active
                </span>
              )}
            </h3>

            <div className="space-y-4">
              {/* Price Training Toggle */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs text-terminal-text block font-bold">Enable Price Training</span>
                  <span className="text-[10px] text-terminal-muted">Prompt for price adjustments in cents</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priceTrainingEnabled}
                    onChange={(e) => updateSettings({ priceTrainingEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
                </label>
              </div>

              {priceTrainingEnabled && (
                <div className="space-y-4 pt-2 border-t border-terminal-border/40">
                  {/* Price Mode Selector: Preset vs Custom */}
                  <div>
                    <label className="text-[10px] text-terminal-muted uppercase block mb-1 font-bold">
                      Price Movement Range Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => updateSettings({ priceRangeMode: 'preset' })}
                        className={`py-1.5 px-3 border text-center font-bold transition-colors ${
                          priceRangeMode === 'preset'
                            ? 'bg-info-blue/20 border-info-blue text-info-blue font-bold'
                            : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:border-terminal-border'
                        }`}
                      >
                        Preset Max Limit
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSettings({ priceRangeMode: 'custom' })}
                        className={`py-1.5 px-3 border text-center font-bold transition-colors ${
                          priceRangeMode === 'custom'
                            ? 'bg-info-blue/20 border-info-blue text-info-blue font-bold'
                            : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:border-terminal-border'
                        }`}
                      >
                        Custom Min/Max Range
                      </button>
                    </div>
                  </div>

                  {priceRangeMode === 'preset' ? (
                    /* Max Price Adjustment Preset */
                    <div>
                      <label className="text-[10px] text-terminal-muted uppercase block mb-1 font-bold">
                        Max Price Adjustment
                      </label>
                      <select
                        value={maxPriceAdjustment}
                        onChange={(e) => updateSettings({ maxPriceAdjustment: Number(e.target.value) })}
                        className="w-full bg-terminal-bg border border-terminal-border text-xs py-1.5 px-2 text-terminal-text focus:outline-none focus:border-info-blue"
                      >
                        <option value={1}>1¢ Limit (1¢ only)</option>
                        <option value={3}>3¢ Limit (1¢ to 3¢)</option>
                        <option value={5}>5¢ Limit (1¢ to 5¢ Default)</option>
                        <option value={10}>10¢ Limit (1¢ to 10¢)</option>
                      </select>
                    </div>
                  ) : (
                    /* Custom Min and Max Inputs */
                    <div className="grid grid-cols-2 gap-3 bg-terminal-bg p-3 border border-terminal-border">
                      <div>
                        <label className="text-[10px] text-terminal-muted uppercase block mb-1 font-bold">
                          Min Price Delta (cents)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={maxPriceAdjustment || 100}
                          value={minPriceAdjustment}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                              updateSettings({ minPriceAdjustment: val });
                            }
                          }}
                          className="w-full bg-terminal-panel border border-terminal-border text-xs py-1.5 px-2 text-terminal-text text-center focus:outline-none focus:border-info-blue"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-terminal-muted uppercase block mb-1 font-bold">
                          Max Price Delta (cents)
                        </label>
                        <input
                          type="number"
                          min={minPriceAdjustment || 1}
                          max={500}
                          value={maxPriceAdjustment}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= (minPriceAdjustment || 1)) {
                              updateSettings({ maxPriceAdjustment: val });
                            }
                          }}
                          className="w-full bg-terminal-panel border border-terminal-border text-xs py-1.5 px-2 text-terminal-text text-center focus:outline-none focus:border-info-blue"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* TRAINING DEFAULTS & TARGET ECNs */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              TRAINING DEFAULTS
            </h3>

            <div className="space-y-4">
              {/* Smart Learning Default */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs text-terminal-text block font-bold">Smart Learning</span>
                  <span className="text-[10px] text-terminal-muted">Adapt weights based on mistake frequency</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smartLearningEnabled}
                    onChange={(e) => updateSettings({ smartLearningEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
                </label>
              </div>

              {/* Default Prompt Count */}
              <div>
                <label className="text-[10px] text-terminal-muted uppercase block mb-1 font-bold">
                  Default Prompt Count
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={[10, 25, 50, 100].includes(sessionLength) ? sessionLength : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        updateSettings({ sessionLength: 15 });
                      } else {
                        updateSettings({ sessionLength: Number(val) });
                      }
                    }}
                    className="flex-1 bg-terminal-bg border border-terminal-border text-xs py-1.5 px-2 text-terminal-text focus:outline-none focus:border-info-blue"
                  >
                    <option value={10}>10 Prompts</option>
                    <option value={25}>25 Prompts</option>
                    <option value={50}>50 Prompts</option>
                    <option value={100}>100 Prompts</option>
                    <option value="custom">Custom</option>
                  </select>
                  {![10, 25, 50, 100].includes(sessionLength) && (
                    <input
                      type="number"
                      min={1}
                      value={sessionLength}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          updateSettings({ sessionLength: val });
                        }
                      }}
                      className="w-24 bg-terminal-bg border border-terminal-border text-xs py-1.5 px-2 text-terminal-text text-center focus:outline-none focus:border-info-blue"
                      placeholder="Count"
                    />
                  )}
                </div>
              </div>

              {/* Target ECN Mode Toggle */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs text-terminal-text block font-bold">Target ECN Mode</span>
                  <span className="text-[10px] text-terminal-muted">Train only on selected ECN tickers</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetEcnModeEnabled}
                    onChange={(e) => updateSettings({ targetEcnModeEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
                </label>
              </div>

              {/* Target ECN Selection */}
              {targetEcnModeEnabled && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-terminal-muted uppercase block font-bold">
                    Target ECNs ({targetEcns.length} Selected)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1">
                    {activeEcns.map((ecn) => {
                      const isSelected = targetEcns.includes(ecn);
                      return (
                        <button
                          type="button"
                          key={ecn}
                          onClick={() => {
                            let nextEcns: string[];
                            if (targetEcns.includes(ecn)) {
                              nextEcns = targetEcns.length > 1 ? targetEcns.filter((e) => e !== ecn) : targetEcns;
                            } else {
                              nextEcns = [...targetEcns, ecn];
                            }
                            updateSettings({ targetEcns: nextEcns });
                          }}
                          className={`p-1.5 border text-center font-mono text-[10px] cursor-pointer select-none transition-colors ${
                            isSelected 
                              ? 'bg-info-blue/20 border-info-blue text-info-blue font-bold' 
                              : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:border-terminal-muted'
                          }`}
                        >
                          {ecn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pacing, Analytics, Storage Flush */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* PACING & SPEED CONFIGURATION */}
            <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
              <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
                PACING & SPEED CONFIGURATION
              </h3>

              <div className="space-y-3 text-xs">
                {/* Drill Practice Mode */}
                <div>
                  <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                    Drill Practice Mode
                  </label>
                  <select
                    value={practiceModeType}
                    onChange={(e) => updateSettings({ practiceModeType: e.target.value as 'stable' | 'time_limit' })}
                    className="w-full bg-terminal-bg border border-terminal-border py-1.5 px-2 text-terminal-text focus:outline-none focus:border-info-blue"
                  >
                    <option value="stable">Stable Mode (Accuracy focus)</option>
                    <option value="time_limit">Time-Limit Mode (Speed focus)</option>
                  </select>
                </div>

                {/* Feedback Delay */}
                <div>
                  <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                    Feedback Delay Transition
                  </label>
                  <select
                    value={feedbackDelayMs}
                    onChange={(e) => updateSettings({ feedbackDelayMs: Number(e.target.value) })}
                    className="w-full bg-terminal-bg border border-terminal-border py-1.5 px-2 text-terminal-text focus:outline-none focus:border-info-blue"
                  >
                    <option value={0}>0ms (Instant transition)</option>
                    <option value={250}>250ms (Snappy transition)</option>
                    <option value={500}>500ms (Default transition)</option>
                    <option value={1000}>1000ms (Slow transition)</option>
                  </select>
                </div>

                {practiceModeType === 'time_limit' && (
                  <>
                    <div className="flex justify-between items-center py-1">
                      <div>
                        <span className="text-xs text-terminal-text block font-bold">Adaptive Speed Pacing</span>
                        <span className="text-[10px] text-terminal-muted font-normal">Decrease limit on correct execution streaks</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adaptivePacingEnabled}
                          onChange={(e) => updateSettings({ adaptivePacingEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
                      </label>
                    </div>

                    <div>
                      <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                        Initial Time Limit
                      </label>
                      <select
                        value={initialTimeLimitMs}
                        onChange={(e) => updateSettings({ initialTimeLimitMs: Number(e.target.value) })}
                        className="w-full bg-terminal-bg border border-terminal-border py-1.5 px-2 text-terminal-text focus:outline-none focus:border-info-blue"
                      >
                        <option value={833}>833ms (6 orders / 5s target)</option>
                        <option value={1000}>1000ms (1.0 second limit)</option>
                        <option value={1500}>1500ms (1.5 second limit)</option>
                        <option value={2000}>2000ms (2.0 second limit)</option>
                        <option value={3000}>3000ms (3.0 second limit)</option>
                        <option value={5000}>5000ms (5.0 second limit)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ANALYTICS CRITERIA */}
            <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
              <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
                ANALYTICS AUDITING CRITERIA
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="text-xs text-terminal-text block font-bold">Reset Tracking</span>
                    <span className="text-[10px] text-terminal-muted">Audit spacebar input reset operations</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackResets}
                      onChange={(e) => updateSettings({ trackResets: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="text-xs text-terminal-text block font-bold">Overshoot Tracking</span>
                    <span className="text-[10px] text-terminal-muted font-normal">Track excessive keystroke overshoots</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackOvershoots}
                      onChange={(e) => updateSettings({ trackOvershoots: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="text-xs text-terminal-text block font-bold">Recovery Tracking</span>
                    <span className="text-[10px] font-mono text-terminal-muted">Audit sequence adjustments before submission</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackRecoveries}
                      onChange={(e) => updateSettings({ trackRecoveries: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-terminal-bg border border-terminal-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-terminal-muted after:border-terminal-border after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-info-blue peer-checked:border-info-blue"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                if (confirm('Flush historical trainer databases and ECN weights? This cannot be undone.')) {
                  clearHistory();
                }
              }}
              className="w-full py-2.5 bg-error-red/10 border border-error-red/30 hover:bg-error-red/20 text-error-red text-xs uppercase cursor-pointer font-bold transition-colors"
            >
              Flush Local Storage History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
