import React from 'react';
import { useTrainerStore } from '../store/trainerStore';
import type { KeyBindings, ECN } from '../types';
import { ALL_ECNS } from '../core/learning';

export const Settings: React.FC = () => {
  const {
    submissionMethod,
    cancelMethod,
    smartLearningEnabled,
    sessionLength,
    priceTrainingEnabled,
    keyBindings,
    trackResets,
    trackOvershoots,
    trackRecoveries,
    maxPriceAdjustment,
    practiceModeType,
    adaptivePacingEnabled,
    feedbackDelayMs,
    initialTimeLimitMs,
    speedDecayMs,
    speedPenaltyMs,
    targetStreakLength,
    targetEcnModeEnabled,
    targetEcns,
    updateSettings,
    clearHistory
  } = useTrainerStore();

  const handleKeyCapture = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof KeyBindings) => {
    e.preventDefault();
    updateSettings({
      keyBindings: {
        ...keyBindings,
        [field]: e.code
      }
    });
  };

  const bindingRows = [
    { label: 'Group 1 (NSDQ / ARCA / EDGX / EDGA / IEX)', buyField: 'buyGroup1' as const, sellField: 'sellGroup1' as const },
    { label: 'Group 2 (MEMX / MIAX / AMEX / CHSX / NSEX / PHLX)', buyField: 'buyGroup2' as const, sellField: 'sellGroup2' as const },
    { label: 'Group 3 (BATS / BATY / BOSX / NYSE)', buyField: 'buyGroup3' as const, sellField: 'sellGroup3' as const }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Title */}
      <div className="bg-terminal-panel border border-terminal-border p-4">
        <h2 className="text-base font-bold font-mono tracking-wider text-terminal-text uppercase">
          [SETTINGS_MANAGER] - TERMINAL CONFIGURATION
        </h2>
        <p className="text-xs text-terminal-muted mt-0.5">
          Review and alter physical routing definitions, defaults, and auditing criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: General, Training, Analytics */}
        <div className="lg:col-span-5 space-y-5">
          {/* GENERAL */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              GENERAL SETTINGS
            </h3>

            <div className="space-y-3">
              {/* Submission Method */}
              <div>
                <span className="text-[10px] font-mono text-terminal-muted uppercase block mb-1">
                  Submission Mode
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer">
                    <input
                      type="radio"
                      name="subMethod"
                      checked={submissionMethod === 'Enter'}
                      onChange={() => updateSettings({ submissionMethod: 'Enter' })}
                      className="accent-info-blue"
                    />
                    Enter
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer">
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
                <span className="text-[10px] font-mono text-terminal-muted uppercase block mb-1">
                  Clear/Cancel Mode
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer">
                    <input
                      type="radio"
                      name="cancelMethod"
                      checked={cancelMethod === 'Escape'}
                      onChange={() => updateSettings({ cancelMethod: 'Escape' })}
                      className="accent-info-blue"
                    />
                    Escape
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer">
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

          {/* TRAINING */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              TRAINING DEFAULTS
            </h3>

            <div className="space-y-3">
              {/* Smart Learning Default */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs font-mono text-terminal-text block">Smart Learning</span>
                  <span className="text-[10px] font-mono text-terminal-muted">Adapt weights based on mistake frequency</span>
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
                <label className="text-[10px] font-mono text-terminal-muted uppercase block mb-1 font-bold">
                  Default Prompt Count
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={[10, 25, 50, 100].includes(sessionLength) ? sessionLength : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        updateSettings({ sessionLength: 15 }); // Default custom count
                      } else {
                        updateSettings({ sessionLength: Number(val) });
                      }
                    }}
                    className="flex-1 bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
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
                      className="w-24 bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono text-center focus:outline-none focus:border-info-blue"
                      placeholder="Count"
                    />
                  )}
                </div>
              </div>

              {/* Price Training Default */}
              <div className="flex justify-between items-center py-1 font-mono">
                <div>
                  <span className="text-xs text-terminal-text block">Price Training Default</span>
                  <span className="text-[10px] text-terminal-muted">Include price adjustment arrow tasks</span>
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

              {/* Max Price Adjustment Limit */}
              <div>
                <label className="text-[10px] font-mono text-terminal-muted uppercase block mb-1 font-bold">
                  Max Price Adjustment
                </label>
                <select
                  value={maxPriceAdjustment}
                  onChange={(e) => updateSettings({ maxPriceAdjustment: Number(e.target.value) as 1 | 3 | 5 | 10 })}
                  className="w-full bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                >
                  <option value={1}>1¢ Limit</option>
                  <option value={3}>3¢ Limit</option>
                  <option value={5}>5¢ Limit (Default)</option>
                  <option value={10}>10¢ Limit</option>
                </select>
              </div>

              {/* Target ECN Mode Default */}
              <div className="flex justify-between items-center py-1 font-mono">
                <div>
                  <span className="text-xs text-terminal-text block">Target ECN Mode</span>
                  <span className="text-[10px] text-terminal-muted">Train only on a single selected ECN</span>
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
                  <label className="text-[10px] font-mono text-terminal-muted uppercase block font-bold">
                    Target ECNs (Select one or more)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {ALL_ECNS.map((ecn) => {
                      const isSelected = targetEcns.includes(ecn);
                      return (
                        <button
                          type="button"
                          key={ecn}
                          onClick={() => {
                            let nextEcns: ECN[];
                            if (targetEcns.includes(ecn)) {
                              nextEcns = targetEcns.length > 1 ? targetEcns.filter((e) => e !== ecn) : targetEcns;
                            } else {
                              nextEcns = [...targetEcns, ecn];
                            }
                            updateSettings({ targetEcns: nextEcns });
                          }}
                          className={`p-1.5 border text-center font-mono text-[10px] cursor-pointer select-none transition-colors ${
                            isSelected 
                              ? 'bg-info-blue/10 border-info-blue text-info-blue font-bold' 
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

          {/* PACING & SPEED CONFIGURATION */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              PACING & SPEED CONFIGURATION
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {/* Drill Practice Mode */}
              <div>
                <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                  Drill Practice Mode
                </label>
                <select
                  value={practiceModeType}
                  onChange={(e) => updateSettings({ practiceModeType: e.target.value as 'stable' | 'time_limit' })}
                  className="w-full bg-terminal-bg border border-terminal-border py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
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
                  className="w-full bg-terminal-bg border border-terminal-border py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                >
                  <option value={0}>0ms (Instant transition)</option>
                  <option value={250}>250ms (Snappy transition)</option>
                  <option value={500}>500ms (Default transition)</option>
                  <option value={1000}>1000ms (Slow transition)</option>
                </select>
              </div>

              {practiceModeType === 'time_limit' && (
                <>
                  {/* Adaptive Pacing Toggles */}
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <span className="text-xs text-terminal-text block">Adaptive Speed pacing</span>
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

                  {/* Initial Limit */}
                  <div>
                    <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                      Initial Time Limit
                    </label>
                    <select
                      value={initialTimeLimitMs}
                      onChange={(e) => updateSettings({ initialTimeLimitMs: Number(e.target.value) })}
                      className="w-full bg-terminal-bg border border-terminal-border py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                    >
                      <option value={833}>833ms (6 orders / 5s target)</option>
                      <option value={1000}>1000ms (1.0 second limit)</option>
                      <option value={1500}>1500ms (1.5 second limit)</option>
                      <option value={2000}>2000ms (2.0 second limit)</option>
                      <option value={3000}>3000ms (3.0 second limit)</option>
                      <option value={5000}>5000ms (5.0 second limit)</option>
                    </select>
                  </div>

                  {adaptivePacingEnabled && (
                    <>
                      {/* Streak length */}
                      <div>
                        <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                          Streak Deceleration Trigger
                        </label>
                        <select
                          value={targetStreakLength}
                          onChange={(e) => updateSettings({ targetStreakLength: Number(e.target.value) })}
                          className="w-full bg-terminal-bg border border-terminal-border py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                        >
                          <option value={2}>2 Correct Orders</option>
                          <option value={3}>3 Correct Orders (Default)</option>
                          <option value={5}>5 Correct Orders</option>
                          <option value={10}>10 Correct Orders</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Decay */}
                        <div>
                          <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                            Decay step
                          </label>
                          <select
                            value={speedDecayMs}
                            onChange={(e) => updateSettings({ speedDecayMs: Number(e.target.value) })}
                            className="w-full bg-terminal-bg border border-terminal-border py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                          >
                            <option value={25}>-25ms</option>
                            <option value={50}>-50ms</option>
                            <option value={100}>-100ms</option>
                            <option value={200}>-200ms</option>
                          </select>
                        </div>

                        {/* Penalty */}
                        <div>
                          <label className="text-[10px] text-terminal-muted uppercase block mb-1">
                            Penalty step
                          </label>
                          <select
                            value={speedPenaltyMs}
                            onChange={(e) => updateSettings({ speedPenaltyMs: Number(e.target.value) })}
                            className="w-full bg-terminal-bg border border-terminal-border py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                          >
                            <option value={50}>+50ms penalty</option>
                            <option value={100}>+100ms penalty</option>
                            <option value={200}>+200ms penalty (Default)</option>
                            <option value={500}>+500ms penalty</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ANALYTICS */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              ANALYTICS CRITERIA
            </h3>

            <div className="space-y-3">
              {/* Reset Tracking */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs font-mono text-terminal-text block">Reset Tracking</span>
                  <span className="text-[10px] font-mono text-terminal-muted">Audit spacebar input reset operations</span>
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

              {/* Overshoot Tracking */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs font-mono text-terminal-text block">Overshoot Tracking</span>
                  <span className="text-[10px] font-mono text-terminal-muted">Track excessive keystroke overshoots</span>
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

              {/* Recovery Tracking */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-xs font-mono text-terminal-text block">Recovery Tracking</span>
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

        {/* Right Column: Key Bindings */}
        <div className="lg:col-span-7 bg-terminal-panel border border-terminal-border p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              KEY BINDINGS
            </h3>
            <p className="text-[10px] font-mono text-terminal-muted leading-tight">
              Re-map the physical keyboard keys mapped to ECN groups. Click a box and press any physical key to bind. Routing commands require holding the Shift modifier.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-terminal-border text-terminal-muted text-[10px]">
                    <th className="py-2">ECN GROUP DESCRIPTOR</th>
                    <th className="py-2 w-32">BUY KEYBIND</th>
                    <th className="py-2 w-32">SELL KEYBIND</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/30">
                  {bindingRows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-2.5 text-[11px] text-terminal-text font-bold uppercase pr-2">
                        {row.label}
                      </td>
                      <td className="py-2.5">
                        <input
                          type="text"
                          value={keyBindings[row.buyField]}
                          onKeyDown={(e) => handleKeyCapture(e, row.buyField)}
                          readOnly
                          placeholder="Press key..."
                          className="w-28 bg-terminal-bg border border-terminal-border text-center text-xs py-1 text-info-blue font-bold focus:outline-none focus:border-info-blue cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          type="text"
                          value={keyBindings[row.sellField]}
                          onKeyDown={(e) => handleKeyCapture(e, row.sellField)}
                          readOnly
                          placeholder="Press key..."
                          className="w-28 bg-terminal-bg border border-terminal-border text-center text-xs py-1 text-warning-amber font-bold focus:outline-none focus:border-warning-amber cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-terminal-border/40">
            <button
              onClick={() => {
                if (confirm('Flush historical trainer databases and ECN weights? This cannot be undone.')) {
                  clearHistory();
                }
              }}
              className="w-full py-2 bg-error-red/10 border border-error-red/30 hover:bg-error-red/20 text-error-red font-mono text-xs uppercase cursor-pointer font-bold"
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
