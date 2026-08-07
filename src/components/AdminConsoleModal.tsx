import React, { useState } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { useLicenseStore } from '../store/licenseStore';
import {
  findTodayGaps,
  injectMultiSessionsIntoGap,
  calculateOptimalFillPlan,
  type PracticeGap
} from '../core/gapFiller';
import { injectCustomSessionIntoStorage, calculateSessionDuration } from '../core/sessionInjector';

interface AdminConsoleModalProps {
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'direct' | 'gaps'>('direct');

  React.useEffect(() => {
    setPasswordInput('');
  }, []);

  // Form state for Direct Session Injector
  const [injectDate, setInjectDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [injectPrompts, setInjectPrompts] = useState(50);
  const [injectAccuracy, setInjectAccuracy] = useState(95);
  const [injectSpeedMs, setInjectSpeedMs] = useState(800);
  const [injectMode, setInjectMode] = useState<'mixed' | 'buy_only' | 'sell_only'>('mixed');

  const sessions = useTrainerStore((state) => state.sessions);
  const setSessions = useTrainerStore((state) => state.setSessions);
  const devPasscode = useLicenseStore((state) => state.devPasscode) || '2026';

  // Find today's gaps
  const gaps = findTodayGaps(sessions);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === devPasscode) {
      setIsAuthenticated(true);
      setErrorMessage('');
    } else {
      setErrorMessage('[AUTH_FAILED] INVALID SECURITY CODE');
    }
  };

  const handleInjectGap = (gap: PracticeGap, targetMs: number) => {
    try {
      const targetMins = Math.round(targetMs / 60000);
      const updated = injectMultiSessionsIntoGap(gap, targetMs, sessions);
      setSessions(updated);
      setSuccessMessage(`[SUCCESS] Injected runs filling ${targetMins} minutes into gap!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage('[ERROR] Injection failed');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCustomInject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calculatedMs = calculateSessionDuration(injectPrompts, injectSpeedMs, 1200);
      const updated = await injectCustomSessionIntoStorage(
        {
          date: new Date(injectDate + 'T12:00:00.000Z').toISOString(),
          promptCount: Number(injectPrompts),
          accuracy: Number(injectAccuracy),
          avgSpeedMs: Number(injectSpeedMs),
          mode: injectMode,
          interPromptPauseMs: 1200
        },
        sessions
      );
      setSessions(updated);
      setSuccessMessage(`[SUCCESS] Injected run (${formatDuration(calculatedMs)}, ${injectPrompts} prompts, ${injectAccuracy}%) for ${injectDate}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage('[ERROR] Custom injection failed');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s}s`;
  };

  const getPlanPreviewText = (targetMs: number): string => {
    const plan = calculateOptimalFillPlan(targetMs);
    if (plan.length === 0) return 'No sessions will fit';

    const counts: Record<number, number> = {};
    plan.forEach((item) => {
      counts[item.prompts] = (counts[item.prompts] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([prompts, count]) => `${count}x [${prompts}p]`)
      .join(' + ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-terminal-bg/90 backdrop-blur-sm select-none text-terminal-text font-mono">
      <div className="relative w-full max-w-lg bg-terminal-panel border border-terminal-border p-6 shadow-2xl font-mono">
        {/* Header Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-success-green" />

        <div className="flex justify-between items-center border-b border-terminal-border pb-3 mb-4">
          <h2 className="text-xs font-bold tracking-wider text-success-green uppercase flex items-center gap-2">
            <span>⚡</span> [ADMIN & DEV CONSOLE]
          </h2>
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-white cursor-pointer transition-colors text-xs font-bold font-mono border-0 bg-transparent uppercase"
          >
            [CLOSE]
          </button>
        </div>

        {/* 1. PASSWORD GATED SCREEN */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4 py-2">
            <div className="text-center space-y-2">
              <p className="text-xs text-terminal-text leading-relaxed font-sans">
                This console is locked for administrative controls. Enter security code to open.
              </p>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-terminal-muted">
                Security Passcode
              </label>
              <input
                type="password"
                placeholder="••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="mt-2 w-full border border-terminal-border bg-terminal-bg px-4 py-2 text-center text-terminal-text placeholder-terminal-muted/40 outline-none transition-colors focus:border-success-green font-mono text-xs uppercase"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="border border-error-red/30 bg-error-red/10 px-4 py-2 text-xs text-error-red text-center font-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={!passwordInput.trim()}
              className="w-full cursor-pointer bg-success-green border border-success-green hover:bg-success-green/80 text-terminal-bg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:bg-terminal-border/20 disabled:text-terminal-muted disabled:border-terminal-border"
            >
              [Access Console]
            </button>
          </form>
        ) : (
          /* 2. AUTHENTICATED BOARD */
          <div className="space-y-4">
            {/* Tab Bar */}
            <div className="flex border-b border-terminal-border text-xs font-bold">
              <button
                onClick={() => setActiveTab('direct')}
                className={`flex-1 py-2 text-center transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'direct'
                    ? 'border-success-green text-success-green font-bold bg-terminal-bg/40'
                    : 'border-transparent text-terminal-muted hover:text-terminal-text'
                }`}
              >
                ⚡ DIRECT INJECTOR
              </button>
              <button
                onClick={() => setActiveTab('gaps')}
                className={`flex-1 py-2 text-center transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'gaps'
                    ? 'border-success-green text-success-green font-bold bg-terminal-bg/40'
                    : 'border-transparent text-terminal-muted hover:text-terminal-text'
                }`}
              >
                📊 GAP CALIBRATION
              </button>
            </div>

            {successMessage && (
              <div className="border border-success-green/30 bg-success-green/10 px-4 py-2 text-xs text-success-green text-center font-bold animate-pulse">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="border border-error-red/30 bg-error-red/10 px-4 py-2 text-xs text-error-red text-center font-bold">
                {errorMessage}
              </div>
            )}

            {/* TAB 1: DIRECT SESSION INJECTOR */}
            {activeTab === 'direct' && (() => {
              const derivedMs = calculateSessionDuration(injectPrompts, injectSpeedMs, 1200);
              return (
                <form onSubmit={handleCustomInject} className="space-y-3 pt-1">
                  <div className="bg-terminal-bg/80 border border-info-blue/40 p-2.5 text-[11px] font-mono space-y-1">
                    <div className="flex justify-between items-center text-info-blue font-bold">
                      <span>DERIVED SESSION DURATION:</span>
                      <span className="text-xs font-black">{formatDuration(derivedMs)}</span>
                    </div>
                    <p className="text-[9px] text-terminal-muted leading-tight">
                      Math: {injectPrompts} prompts × ({injectSpeedMs}ms speed + 1.2s pause) = {formatDuration(derivedMs)} total active duration.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-terminal-muted uppercase font-bold mb-1">
                        Session Date
                      </label>
                      <input
                        type="date"
                        value={injectDate}
                        onChange={(e) => setInjectDate(e.target.value)}
                        className="w-full bg-terminal-bg border border-terminal-border px-3 py-1.5 text-terminal-text text-xs outline-none focus:border-success-green"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-terminal-muted uppercase font-bold mb-1">
                        Prompt Count
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        value={injectPrompts}
                        onChange={(e) => setInjectPrompts(Number(e.target.value))}
                        className="w-full bg-terminal-bg border border-terminal-border px-3 py-1.5 text-terminal-text text-xs outline-none focus:border-success-green"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-terminal-muted uppercase font-bold mb-1">
                        Accuracy ({injectAccuracy}%)
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={injectAccuracy}
                        onChange={(e) => setInjectAccuracy(Number(e.target.value))}
                        className="w-full accent-success-green"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-terminal-muted uppercase font-bold mb-1">
                        Avg Speed (ms)
                      </label>
                      <input
                        type="number"
                        min="200"
                        max="5000"
                        step="50"
                        value={injectSpeedMs}
                        onChange={(e) => setInjectSpeedMs(Number(e.target.value))}
                        className="w-full bg-terminal-bg border border-terminal-border px-3 py-1.5 text-terminal-text text-xs outline-none focus:border-success-green"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] text-terminal-muted uppercase font-bold mb-1">
                        Execution Mode
                      </label>
                      <select
                        value={injectMode}
                        onChange={(e) => setInjectMode(e.target.value as any)}
                        className="w-full bg-terminal-bg border border-terminal-border px-3 py-1.5 text-terminal-text text-xs outline-none focus:border-success-green"
                      >
                        <option value="mixed">Mixed</option>
                        <option value="buy_only">Buy Only</option>
                        <option value="sell_only">Sell Only</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 cursor-pointer bg-success-green text-terminal-bg border border-success-green hover:bg-success-green/80 font-bold py-2 text-xs uppercase tracking-wider transition-colors"
                  >
                    ⚡ [INJECT CUSTOM RUN INTO DATABASE]
                  </button>
                </form>
              );
            })()}

            {/* TAB 2: GAP CALIBRATION */}
            {activeTab === 'gaps' && (
              <div className="space-y-4">
                <div className="text-[10px] text-terminal-muted bg-terminal-bg/50 px-4 py-2 border border-terminal-border flex justify-between">
                  <span>TODAY'S REGISTRY STATUS: </span>
                  <span className="text-terminal-text font-bold">
                    {sessions.filter((s) => new Date(s.date).toDateString() === new Date().toDateString()).length} runs completed
                  </span>
                </div>

                {gaps.length === 0 ? (
                  <div className="text-center py-6 text-xs text-terminal-muted space-y-2">
                    <p className="font-bold text-warning-amber uppercase">[NO_GAPS_DETECTED]</p>
                    <p className="text-[10px] leading-relaxed max-w-sm mx-auto">
                      No idle gaps longer than 2 minutes were found between today's completed runs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {gaps.map((gap, index) => {
                      const maxSafeMs = Math.floor(gap.durationMs * 0.9);
                      const maxSafeMinutes = Math.floor(maxSafeMs / 60000);
                      const targetDurations = [5, 10, 15, 20, 30].filter((d) => d <= maxSafeMinutes);

                      return (
                        <div key={gap.id} className="border border-terminal-border/60 bg-terminal-bg/40 p-3 space-y-2">
                          <div className="flex justify-between items-center text-xs border-b border-terminal-border/20 pb-1">
                            <div>
                              <span className="font-bold text-info-blue block uppercase text-[10px]">
                                GAP #{index + 1} ({formatDuration(gap.durationMs)} available)
                              </span>
                              <span className="text-[10px] text-terminal-muted">
                                {formatTime(gap.prevSessionDate)} ➔ {formatTime(gap.nextSessionDate)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {targetDurations.map((mins) => {
                              const ms = mins * 60000;
                              return (
                                <button
                                  key={mins}
                                  onClick={() => handleInjectGap(gap, ms)}
                                  className="px-2 py-1 bg-terminal-bg border border-terminal-border hover:border-success-green hover:text-success-green text-[10px] font-bold transition-colors cursor-pointer text-center"
                                  title={`Injects: ${getPlanPreviewText(ms)}`}
                                >
                                  {mins} Mins
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

