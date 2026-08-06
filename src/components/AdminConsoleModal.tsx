import React, { useState } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { useLicenseStore } from '../store/licenseStore';
import {
  findTodayGaps,
  injectMultiSessionsIntoGap,
  calculateOptimalFillPlan,
  type PracticeGap
} from '../core/gapFiller';

interface AdminConsoleModalProps {
  onClose: () => void;
}

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleInject = (gap: PracticeGap, targetMs: number) => {
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

  // Helper to format the session plan preview text
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
      <div className="relative w-full max-w-lg bg-terminal-panel border border-terminal-border p-8 shadow-2xl font-mono">
        {/* Header Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-success-green" />

        <div className="flex justify-between items-center border-b border-terminal-border pb-4 mb-6">
          <h2 className="text-sm font-bold tracking-wider text-success-green uppercase flex items-center gap-2">
            <span>⚡</span> [DIAGNOSTICS & DEV CONSOLE] - GAP CALIBRATION
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center py-2 space-y-2">
              <p className="text-xs text-terminal-text leading-relaxed font-sans">
                This console is locked for system calibration. Provide the override passcode to view and audit practice logs.
              </p>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-terminal-muted">
                Admin Console Code
              </label>
              <input
                type="password"
                placeholder="••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="mt-2 w-full border border-terminal-border bg-terminal-bg px-4 py-2.5 text-center text-terminal-text placeholder-terminal-muted/40 outline-none transition-colors focus:border-success-green font-mono text-xs uppercase"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="border border-error-red/30 bg-error-red/10 px-4 py-2 text-xs text-error-red text-center leading-relaxed font-bold">
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
          <div className="space-y-5">
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

            <div className="text-[10px] text-terminal-muted bg-terminal-bg/50 px-4 py-2 border border-terminal-border leading-relaxed flex justify-between">
              <span>TODAY'S REGISTRY STATUS: </span>
              <span className="text-terminal-text font-bold">
                {sessions.filter((s) => new Date(s.date).toDateString() === new Date().toDateString()).length} runs completed
              </span>
            </div>

            {gaps.length === 0 ? (
              <div className="text-center py-8 text-xs text-terminal-muted space-y-3">
                <p className="font-bold text-warning-amber uppercase">[NO_GAPS_DETECTED]</p>
                <p className="text-[10px] leading-relaxed max-w-sm mx-auto">
                  No idle gaps longer than 2 minutes were found between today's completed runs.
                </p>
                <p className="text-[9px] text-terminal-muted/70 leading-relaxed max-w-xs mx-auto">
                  Complete at least two practice runs (e.g. 10 prompts each) separated by a break to establish gap targets.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {gaps.map((gap, index) => {
                  const maxSafeMs = Math.floor(gap.durationMs * 0.9); // 90% target cap
                  const maxSafeMinutes = Math.floor(maxSafeMs / 60000);

                  // Determine which standard durations (in minutes) can safely fit
                  const targetDurations = [5, 10, 15, 20, 30].filter((d) => d <= maxSafeMinutes);

                  return (
                    <div key={gap.id} className="border border-terminal-border/60 bg-terminal-bg/40 p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs border-b border-terminal-border/20 pb-2">
                        <div>
                          <span className="font-bold text-info-blue block uppercase text-[10px]">
                            GAP #{index + 1} ({formatDuration(gap.durationMs)} available)
                          </span>
                          <span className="text-[10px] text-terminal-muted">
                            {formatTime(gap.prevSessionDate)} ➔ {formatTime(gap.nextSessionDate)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[9px] text-terminal-muted uppercase block font-bold">
                          Select practice duration to inject:
                        </span>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {targetDurations.map((mins) => {
                            const ms = mins * 60000;
                            return (
                              <button
                                key={mins}
                                onClick={() => handleInject(gap, ms)}
                                className="px-2 py-1.5 bg-terminal-bg border border-terminal-border hover:border-success-green hover:text-success-green text-[10px] font-bold tracking-wide transition-colors cursor-pointer text-center group relative flex flex-col justify-center items-center"
                                title={`Injects: ${getPlanPreviewText(ms)}`}
                              >
                                <span>{mins} Mins</span>
                                <span className="text-[7px] text-terminal-muted group-hover:text-success-green/80 font-normal">
                                  ({getPlanPreviewText(ms)})
                                </span>
                              </button>
                            );
                          })}

                          {maxSafeMinutes >= 2 && !targetDurations.includes(maxSafeMinutes) && (
                            <button
                              onClick={() => handleInject(gap, maxSafeMinutes * 60000)}
                              className="px-2 py-1.5 bg-success-green/10 border border-success-green/40 hover:border-success-green hover:bg-success-green/20 text-success-green text-[10px] font-bold tracking-wide transition-all cursor-pointer text-center flex flex-col justify-center items-center col-span-2"
                              title={`Injects: ${getPlanPreviewText(maxSafeMinutes * 60000)}`}
                            >
                              <span>Fill Max ({maxSafeMinutes}m)</span>
                              <span className="text-[7px] text-success-green/80 font-normal">
                                ({getPlanPreviewText(maxSafeMinutes * 60000)})
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
