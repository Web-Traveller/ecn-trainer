import React, { useRef } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { useLiveTimer } from '../hooks/useLiveTimer';
import { processInput } from '../core/routing';
import { ALL_ECNS } from '../core/learning';
import type { ECN } from '../types';

export const Trainer: React.FC = () => {
  // Activate keyboard event listener hook
  useKeyboard();

  const {
    sessionState,
    currentPrompt,
    inputSequence,
    activeRouteKey,
    pressCount,
    userPriceAdjustment,
    startTime,
    accumulatedElapsedMs,
    feedback,
    currentSessionEvents,
    sessionLength,
    spaceResetsInCurrentPrompt,
    keyBindings,
    
    // Config states
    mode,
    priceTrainingEnabled,
    smartLearningEnabled,
    targetEcnModeEnabled,
    targetEcns,
    submissionMethod,
    cancelMethod,
    maxPriceAdjustment,
    practiceModeType,
    adaptivePacingEnabled,
    feedbackDelayMs,
    initialTimeLimitMs,
    speedDecayMs,
    speedPenaltyMs,
    targetStreakLength,

    // Run-time pacing state
    countdownRemaining,
    currentTimeLimitMs,
    consecutiveCorrectCount,
    missedCount,

    // Debug states
    lastPhysicalKey,
    lastKeyVal,
    lastShiftHeld,

    // Actions
    updateSettings,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    resetSession,
    resetToIdle,
    setView,
    handleTimeout
  } = useTrainerStore();

  const timerRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Activate high-resolution clock updating directly on the DOM ref
  useLiveTimer(
    timerRef,
    startTime,
    sessionState,
    accumulatedElapsedMs,
    practiceModeType === 'time_limit' ? currentTimeLimitMs : undefined,
    progressBarRef
  );

  // Ready Countdown timer effect
  React.useEffect(() => {
    if (sessionState !== 'RUNNING' || countdownRemaining === null) return;
    const timer = setTimeout(() => {
      if (countdownRemaining > 1) {
        useTrainerStore.setState({ countdownRemaining: countdownRemaining - 1 });
      } else {
        useTrainerStore.setState({
          countdownRemaining: null,
          startTime: Date.now()
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [sessionState, countdownRemaining]);

  // Timeout monitoring effect
  React.useEffect(() => {
    if (
      sessionState !== 'RUNNING' ||
      practiceModeType !== 'time_limit' ||
      countdownRemaining !== null ||
      startTime === null ||
      feedback !== null
    ) return;

    let active = true;
    const checkTimeout = () => {
      if (!active) return;
      const elapsed = Date.now() - startTime;
      if (elapsed >= currentTimeLimitMs) {
        handleTimeout();
      } else {
        requestAnimationFrame(checkTimeout);
      }
    };

    requestAnimationFrame(checkTimeout);
    return () => {
      active = false;
    };
  }, [sessionState, practiceModeType, countdownRemaining, startTime, currentTimeLimitMs, feedback, handleTimeout]);

  const [showDebug, setShowDebug] = React.useState(false);

  // --- STATS COMPUTATION FOR SUMMARY PAGE ---
  const totalPrompts = currentSessionEvents.length;
  const correctPrompts = currentSessionEvents.filter((e) => e.correct).length;
  const incorrectPrompts = totalPrompts - correctPrompts;
  const finalAccuracy = totalPrompts > 0 ? (correctPrompts / totalPrompts) * 100 : 0;

  const reactionTimes = currentSessionEvents.map((e) => e.reactionTimeMs);
  const averageTimeMs = totalPrompts > 0 ? reactionTimes.reduce((a, b) => a + b, 0) / totalPrompts : 0;
  const fastestTimeMs = totalPrompts > 0 ? Math.min(...reactionTimes) : 0;
  const slowestTimeMs = totalPrompts > 0 ? Math.max(...reactionTimes) : 0;

  // Most common mistakes
  const mistakeCounts: { [key: string]: { expected: string; actual: string; count: number } } = {};
  currentSessionEvents.forEach((e) => {
    if (!e.correct && e.expectedEcn !== e.actualEcn) {
      const key = `${e.expectedEcn}->${e.actualEcn}`;
      if (!mistakeCounts[key]) {
        mistakeCounts[key] = { expected: e.expectedEcn, actual: e.actualEcn, count: 0 };
      }
      mistakeCounts[key].count += 1;
    }
  });
  const sortedMistakes = Object.values(mistakeCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // Weakest ECNs
  const ecnTotals: { [key: string]: { correct: number; total: number } } = {};
  currentSessionEvents.forEach((e) => {
    const ecn = e.expectedEcn;
    if (!ecnTotals[ecn]) {
      ecnTotals[ecn] = { correct: 0, total: 0 };
    }
    ecnTotals[ecn].total += 1;
    if (e.correct) {
      ecnTotals[ecn].correct += 1;
    }
  });
  const weakestEcns = Object.entries(ecnTotals)
    .map(([ecn, data]) => ({ ecn, accuracy: (data.correct / data.total) * 100, ...data }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .filter((x) => x.accuracy < 100)
    .slice(0, 5);

  // --- 1. IDLE VIEW: PRE-SESSION CONFIGURATION AREA ---
  if (sessionState === 'IDLE') {
    return (
      <div key="trainer-config" className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn">
        <div className="bg-terminal-panel border border-terminal-border p-4">
          <h2 className="text-base font-bold font-mono tracking-wider text-terminal-text uppercase">
            [EX_CHAMBER] - SIMULATOR CONTROLS
          </h2>
          <p className="text-xs text-terminal-muted mt-0.5">
            Configure target modes, prompt counts, and focus drill parameters before starting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Configuration Parameters Panel */}
          <div className="md:col-span-6 bg-terminal-panel border border-terminal-border p-4 space-y-4">
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              TRAINING CONFIGURATION PANEL
            </h3>

            {/* Training Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-terminal-muted uppercase block">Training Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'buy_only'}
                    onChange={() => updateSettings({ mode: 'buy_only' })}
                    className="accent-info-blue"
                  />
                  Buy Only
                </label>
                <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'sell_only'}
                    onChange={() => updateSettings({ mode: 'sell_only' })}
                    className="accent-info-blue"
                  />
                  Sell Only
                </label>
                <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'mixed'}
                    onChange={() => updateSettings({ mode: 'mixed' })}
                    className="accent-info-blue"
                  />
                  Mixed
                </label>
              </div>
            </div>

            {/* Prompt Count */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-terminal-muted uppercase block">Prompt Count</label>
              <div className="flex flex-wrap gap-2.5 items-center">
                {[10, 25, 50, 100].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      updateSettings({ sessionLength: count });
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className={`px-2.5 py-1 font-mono text-xs border cursor-pointer transition-colors ${
                      sessionLength === count 
                        ? 'bg-info-blue border-info-blue text-terminal-bg font-black' 
                        : 'border-terminal-border text-terminal-muted hover:border-terminal-muted'
                    }`}
                  >
                    {count}
                  </button>
                ))}

                <div className="flex items-center gap-2 font-mono text-xs text-terminal-text ml-2">
                  <span className="text-[10px] text-terminal-muted uppercase">Custom:</span>
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
                    className="w-20 bg-terminal-bg border border-terminal-border text-xs py-1 px-1.5 text-terminal-text font-mono text-center focus:outline-none focus:border-info-blue"
                    placeholder="Count"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={priceTrainingEnabled}
                    onChange={(e) => updateSettings({ priceTrainingEnabled: e.target.checked })}
                    className="accent-info-blue"
                  />
                  Price Training
                </label>
                <label className="flex items-center gap-2 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={smartLearningEnabled}
                    onChange={(e) => updateSettings({ smartLearningEnabled: e.target.checked })}
                    className="accent-info-blue"
                  />
                  Smart Learning
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={targetEcnModeEnabled}
                    onChange={(e) => updateSettings({ targetEcnModeEnabled: e.target.checked })}
                    className="accent-info-blue"
                  />
                  Target ECN Mode
                </label>
              </div>
            </div>



            {/* Max Price Adjustment selector */}
            {priceTrainingEnabled && (
              <div className="space-y-1.5 border-t border-terminal-border/40 pt-2.5">
                <label className="text-[10px] font-mono text-terminal-muted uppercase block">Max Price Adjustment</label>
                <div className="flex gap-2">
                  {[1, 3, 5, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateSettings({ maxPriceAdjustment: val as 1 | 3 | 5 | 10 })}
                      className={`px-2.5 py-1 font-mono text-xs border cursor-pointer ${
                        maxPriceAdjustment === val 
                          ? 'bg-info-blue border-info-blue text-terminal-bg font-black' 
                          : 'border-terminal-border text-terminal-muted hover:border-terminal-muted'
                      }`}
                    >
                      {val}¢
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Mode */}
            <div className="space-y-1.5 border-t border-terminal-border/60 pt-3">
              <label className="text-[10px] font-mono text-terminal-muted uppercase block">Submission Method</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="radio"
                    name="subModeTrainer"
                    checked={submissionMethod === 'Enter'}
                    onChange={() => updateSettings({ submissionMethod: 'Enter' })}
                    className="accent-info-blue"
                  />
                  Enter
                </label>
                <label className="flex items-center gap-1.5 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="radio"
                    name="subModeTrainer"
                    checked={submissionMethod === 'ShiftEnter'}
                    onChange={() => updateSettings({ submissionMethod: 'ShiftEnter' })}
                    className="accent-info-blue"
                  />
                  Shift + Enter
                </label>
              </div>
            </div>

            {/* Pacing Controls */}
            <div className="space-y-3 border-t border-terminal-border/40 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-terminal-muted uppercase block">Drill Type</label>
                  <select
                    value={practiceModeType}
                    onChange={(e) => updateSettings({ practiceModeType: e.target.value as 'stable' | 'time_limit' })}
                    className="w-full bg-terminal-bg border border-terminal-border text-terminal-text text-xs font-mono p-1.5 rounded-none outline-none cursor-pointer"
                  >
                    <option value="stable">Stable (Accuracy focus)</option>
                    <option value="time_limit">Time-Limit (Speed focus)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-terminal-muted uppercase block">Feedback Transition</label>
                  <select
                    value={feedbackDelayMs}
                    onChange={(e) => updateSettings({ feedbackDelayMs: Number(e.target.value) })}
                    className="w-full bg-terminal-bg border border-terminal-border text-terminal-text text-xs font-mono p-1.5 rounded-none outline-none cursor-pointer"
                  >
                    <option value="0">Instant (0ms)</option>
                    <option value="250">Snappy (250ms)</option>
                    <option value="500">Normal (500ms)</option>
                    <option value="1000">Slow (1000ms)</option>
                  </select>
                </div>
              </div>

              {practiceModeType === 'time_limit' && (
                <div className="space-y-3 pt-1 border-t border-terminal-border/20 mt-1 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-mono text-terminal-text cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={adaptivePacingEnabled}
                        onChange={(e) => updateSettings({ adaptivePacingEnabled: e.target.checked })}
                        className="accent-info-blue"
                      />
                      Adaptive Speed Pacing
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-terminal-muted uppercase block">Start Limit (sec)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="10"
                        value={initialTimeLimitMs / 1000}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            updateSettings({ initialTimeLimitMs: Math.round(val * 1000) });
                          }
                        }}
                        className="w-full bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                      />
                    </div>

                    {adaptivePacingEnabled && (
                      <>
                        <div className="space-y-1">
                          <span className="text-[10px] text-terminal-muted uppercase block">Decay Step (sec)</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="1"
                            value={speedDecayMs / 1000}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                updateSettings({ speedDecayMs: Math.round(val * 1000) });
                              }
                            }}
                            className="w-full bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-terminal-muted uppercase block">Penalty Step (sec)</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0.05"
                            max="2"
                            value={speedPenaltyMs / 1000}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0) {
                                updateSettings({ speedPenaltyMs: Math.round(val * 1000) });
                              }
                            }}
                            className="w-full bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-terminal-muted uppercase block">Correct Threshold</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={targetStreakLength}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val > 0) {
                                updateSettings({ targetStreakLength: val });
                              }
                            }}
                            className="w-full bg-terminal-bg border border-terminal-border text-xs py-1 px-2 text-terminal-text font-mono focus:outline-none focus:border-info-blue"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { startSession(); (document.activeElement as HTMLElement)?.blur(); }}
              className="w-full py-3 bg-success-green hover:bg-success-green/90 text-terminal-bg text-sm font-black font-mono tracking-wider cursor-pointer border-0 uppercase"
            >
              Start Simulator Run
            </button>
          </div>

          {/* ECN Target Mode list */}
          <div className={`md:col-span-6 bg-terminal-panel border border-terminal-border p-4 space-y-3 transition-opacity duration-200 ${
            !targetEcnModeEnabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
          }`}>
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              TARGET ECN SELECTION
            </h3>
            <p className="text-[10px] font-mono text-terminal-muted leading-tight">
              Select one or more target ECNs. Enable "Target ECN Mode" on the left to activate.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {ALL_ECNS.map((ecn) => {
                const isSelected = targetEcns.includes(ecn);
                return (
                  <button
                    key={ecn}
                    disabled={!targetEcnModeEnabled}
                    onClick={() => {
                      let nextEcns: ECN[];
                      if (targetEcns.includes(ecn)) {
                        nextEcns = targetEcns.length > 1 ? targetEcns.filter((e) => e !== ecn) : targetEcns;
                      } else {
                        nextEcns = [...targetEcns, ecn];
                      }
                      updateSettings({ targetEcns: nextEcns });
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className={`p-1.5 border text-center font-mono text-xs cursor-pointer select-none transition-colors ${
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
        </div>
      </div>
    );
  }

  // --- 2. SUMMARY VIEW: COMPLETED OR TERMINATED ---
  if (sessionState === 'COMPLETED' || sessionState === 'TERMINATED') {
    return (
      <div key="trainer-results" className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn">
        <div className="bg-terminal-panel border border-terminal-border p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold font-mono tracking-wider text-terminal-text uppercase">
              [RUN_AUDIT] - TRAINING SESSION DEBRIEF
            </h2>
            <span className={`px-2 py-0.5 text-xs font-mono font-bold uppercase ${
              sessionState === 'COMPLETED' ? 'bg-success-green/10 border border-success-green text-success-green' : 'bg-error-red/10 border border-error-red text-error-red'
            }`}>
              {sessionState}
            </span>
          </div>
          <p className="text-xs text-terminal-muted mt-0.5">
            Statistical breakdown of physical keystrokes, accuracy bounds, and latencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:h-[430px]">
          {/* Main stats matrix */}
          <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col justify-between font-mono text-xs h-full">
            <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              PERFORMANCE SNAPSHOT
            </h3>
            <div className="flex-1 flex flex-col justify-between py-2">
              <div className="flex justify-between py-1 border-b border-terminal-border/30">
                <span className="text-terminal-muted">Total Prompts:</span>
                <span className="text-terminal-text font-bold">{totalPrompts}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-terminal-border/30">
                <span className="text-terminal-muted">Correct Submissions:</span>
                <span className="text-success-green font-bold">{correctPrompts}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-terminal-border/30">
                <span className="text-terminal-muted">Incorrect Slips:</span>
                <span className="text-error-red font-bold">{incorrectPrompts}</span>
              </div>
              {practiceModeType === 'time_limit' && (
                <div className="flex justify-between py-1 border-b border-terminal-border/30">
                  <span className="text-terminal-muted">Missed Prints (Timeouts):</span>
                  <span className="text-warning-amber font-bold">{missedCount}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-terminal-border/30">
                <span className="text-terminal-muted">Final Accuracy:</span>
                <span className={`font-black ${finalAccuracy >= 90 ? 'text-success-green' : finalAccuracy >= 75 ? 'text-warning-amber' : 'text-error-red'}`}>
                  {finalAccuracy.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-terminal-border/30">
                <span className="text-terminal-muted">Average Reaction:</span>
                <span className="text-info-blue font-bold">{(averageTimeMs / 1000).toFixed(3)}s</span>
              </div>
              {practiceModeType === 'time_limit' && adaptivePacingEnabled && (
                <div className="flex justify-between py-1 border-b border-terminal-border/30">
                  <span className="text-terminal-muted">Final Target Speed Limit:</span>
                  <span className="text-terminal-text font-bold">{(currentTimeLimitMs / 1000).toFixed(3)}s</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-terminal-border/30">
                <span className="text-terminal-muted">Fastest Latency:</span>
                <span className="text-terminal-text">{(fastestTimeMs / 1000).toFixed(3)}s</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-terminal-muted">Slowest Latency:</span>
                <span className="text-terminal-text">{(slowestTimeMs / 1000).toFixed(3)}s</span>
              </div>
            </div>
          </div>

          {/* Mismatch & Mistakes matrix */}
          <div className="bg-terminal-panel border border-terminal-border p-4 flex flex-col justify-between font-mono text-xs h-full">
            <div className="flex-1 flex flex-col justify-between gap-4 h-full">
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
                  MOST COMMON MISMATCHES
                </h3>
                <div className="flex-1 overflow-y-auto pt-2 space-y-1.5 max-h-[140px] pr-1">
                  {sortedMistakes.length === 0 ? (
                    <p className="text-[11px] text-success-green py-2 font-bold uppercase">No incorrect keystrokes recorded!</p>
                  ) : (
                    sortedMistakes.map((m, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>Expected <strong className="text-success-green">{m.expected}</strong> → Got <strong className="text-error-red">{m.actual}</strong></span>
                        <span className="text-terminal-muted">({m.count} times)</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 mt-2 border-t border-terminal-border/20 pt-2">
                <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
                  {"WEAKEST DESTINATIONS (<100% ACC)"}
                </h3>
                <div className="flex-1 overflow-y-auto pt-2 space-y-1.5 max-h-[140px] pr-1">
                  {weakestEcns.length === 0 ? (
                    <p className="text-[11px] text-success-green py-2 font-bold uppercase">100% accuracy across all ECNs!</p>
                  ) : (
                    weakestEcns.map((w, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="font-bold text-terminal-text">{w.ecn}</span>
                        <span className="text-error-red">{w.accuracy.toFixed(1)}% accuracy ({w.correct}/{w.total})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action control bar */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              resetToIdle();
              (document.activeElement as HTMLElement)?.blur();
            }}
            className="flex-1 py-3 bg-success-green hover:bg-success-green/90 text-terminal-bg text-sm font-black font-mono tracking-wider cursor-pointer border-0 uppercase text-center"
          >
            Start New Session
          </button>
          <button
            onClick={() => {
              resetToIdle();
              setView('analytics');
              (document.activeElement as HTMLElement)?.blur();
            }}
            className="flex-1 py-3 bg-terminal-border hover:bg-terminal-border/80 border border-terminal-border text-terminal-text text-sm font-bold font-mono tracking-wider cursor-pointer uppercase text-center"
          >
            Review Historical Analytics
          </button>
        </div>
      </div>
    );
  }

  // --- 3. ACTIVE RUN VIEW: RUNNING OR PAUSED ---
  if (!currentPrompt) return null;
  const { action, ecn, priceAdjustment } = currentPrompt;

  // Compute active ECN based on sequence
  let resolvedEcn: ECN | null = null;
  if (activeRouteKey && pressCount > 0) {
    const { currentEcn } = processInput(
      action,
      ecn,
      activeRouteKey,
      pressCount,
      spaceResetsInCurrentPrompt,
      keyBindings
    );
    resolvedEcn = currentEcn;
  }

  const formatPriceAdjustment = (cents: number) => {
    if (cents === 0) return 'Flat';
    return cents > 0 ? `+$${(cents / 100).toFixed(2)}` : `-$${(Math.abs(cents) / 100).toFixed(2)}`;
  };

  const formatInputKeyName = (code: string) => {
    if (code.startsWith('Key')) return code.slice(3);
    if (code === 'Semicolon') return ';';
    if (code === 'Quote') return "'";
    if (code === 'Comma') return ',';
    if (code === 'Period') return '.';
    return code;
  };

  return (
    <div key="trainer-active" className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn relative">
      <div className="bg-terminal-panel border border-terminal-border p-3.5 flex justify-between items-center text-xs font-mono">
        <div className="flex gap-4 text-terminal-muted flex-wrap">
          <span>PROGRESS: <strong className="text-terminal-text">{sessionLength > 0 ? `${currentSessionEvents.length + 1} / ${sessionLength}` : `${currentSessionEvents.length + 1} (Infinite)`}</strong></span>
          <span>MODE: <strong className="text-terminal-text uppercase">{mode}</strong></span>
          <span>PRICE: <strong className="text-terminal-text">{priceTrainingEnabled ? 'ON' : 'OFF'}</strong></span>
          {practiceModeType === 'time_limit' && (
            <span>LIMIT: <strong className="text-warning-amber">{(currentTimeLimitMs / 1000).toFixed(2)}s</strong></span>
          )}
          {practiceModeType === 'time_limit' && adaptivePacingEnabled && (
            <span>STREAK: <strong className="text-success-green">{consecutiveCorrectCount}</strong></span>
          )}
        </div>
        <div className="flex gap-2.5">
          {sessionState === 'RUNNING' ? (
            <button
              onClick={() => { pauseSession(); (document.activeElement as HTMLElement)?.blur(); }}
              disabled={countdownRemaining !== null}
              className="px-3 py-1 bg-warning-amber/10 border border-warning-amber/30 hover:bg-warning-amber/20 text-warning-amber font-mono text-[11px] uppercase cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={() => { resumeSession(); (document.activeElement as HTMLElement)?.blur(); }}
              className="px-3 py-1 bg-success-green/10 border border-success-green/30 hover:bg-success-green/20 text-success-green font-mono text-[11px] uppercase cursor-pointer"
            >
              Resume
            </button>
          )}
          <button
            onClick={() => { resetSession(); (document.activeElement as HTMLElement)?.blur(); }}
            className="px-3 py-1 bg-terminal-border hover:bg-terminal-border/80 border border-terminal-border text-terminal-text font-mono text-[11px] uppercase cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => { endSession(false); (document.activeElement as HTMLElement)?.blur(); }}
            className="px-3 py-1 bg-error-red/10 border border-error-red/30 hover:bg-error-red/20 text-error-red font-mono text-[11px] uppercase cursor-pointer"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Progress Bar for Time Limit Mode */}
      {practiceModeType === 'time_limit' && countdownRemaining === null && (
        <div key="progress-bar-container" className="w-full h-1.5 bg-terminal-border overflow-hidden">
          <div key="progress-bar-el" ref={progressBarRef} className="h-full bg-success-green w-full" style={{ transition: 'width 0.05s linear' }} />
        </div>
      )}

      {/* Main Target ECN Training Layout Chamber */}
      <div className="bg-terminal-panel border border-terminal-border p-8 min-h-[360px] flex flex-col justify-between relative">

        {/* 1. Large Prompt Element (Dominates Screen) */}
        <div className="text-center py-8 space-y-4 select-none font-mono flex flex-col items-center justify-center min-h-[160px]">
          {countdownRemaining !== null ? (
            <div className="space-y-2">
              <span className="text-[10px] text-terminal-muted uppercase tracking-widest block font-bold">GET READY</span>
              <h1 className="text-6xl md:text-7xl font-black text-warning-amber animate-pulse">
                {countdownRemaining}
              </h1>
            </div>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white uppercase">
                {action} {ecn}
              </h1>

              {priceTrainingEnabled && priceAdjustment !== undefined && (
                <div className={`text-4xl md:text-5xl font-black ${priceAdjustment > 0 ? 'text-success-green' : 'text-error-red'}`}>
                  {priceAdjustment > 0 ? `+${priceAdjustment}` : priceAdjustment}¢
                </div>
              )}
            </>
          )}
        </div>

        {/* 2. Live Input buffer */}
        <div className="bg-terminal-bg border border-terminal-border p-4 space-y-3 relative">
          <div className="grid grid-cols-3 gap-4 items-center py-1">
            {/* Column 1: Left - Keyboard Keystroke Buffer */}
            <div className="font-mono text-left">
              <span className="text-[9px] text-terminal-muted uppercase block border-b border-terminal-border/20 pb-0.5 mb-1.5">LIVE INPUT SEQUENCE</span>
              <div className="flex items-center gap-2 min-h-[32px]">
                {countdownRemaining !== null ? (
                  <span className="text-[10px] text-warning-amber italic font-bold">WAITING...</span>
                ) : inputSequence.length === 0 ? (
                  <span className="text-[10px] text-terminal-muted italic">HOLD SHIFT + PRESS KEY</span>
                ) : (
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="px-1.5 py-0.5 bg-terminal-border text-[10px] font-bold text-terminal-text">SHIFT</span>
                    <span className="text-terminal-muted text-[10px] font-bold">+</span>
                    {inputSequence.map((code, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-terminal-muted text-[10px] font-bold">+</span>}
                        <span className="px-1.5 py-0.5 bg-terminal-border text-[10px] font-bold text-info-blue">
                          {formatInputKeyName(code)}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Center - Resolved Target (ONLY ECN name, centered, text-2xl md:text-3xl font-black text-white) */}
            <div className="font-mono text-center flex flex-col justify-center items-center">
              <span className="text-[9px] text-terminal-muted uppercase block border-b border-terminal-border/20 pb-0.5 mb-1.5">RESOLVED ROUTE</span>
              <div className="min-h-[32px] flex items-center justify-center">
                {countdownRemaining !== null ? (
                  <span className="text-[10px] text-terminal-muted uppercase tracking-wider font-semibold">LOCKED</span>
                ) : resolvedEcn ? (
                  <span className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
                    {resolvedEcn}
                  </span>
                ) : inputSequence.length > 0 ? (
                  <span className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
                    INVALID ({inputSequence.map(formatInputKeyName).join('+')})
                  </span>
                ) : (
                  <span className="text-2xl md:text-3xl font-black text-terminal-muted uppercase tracking-wider">—</span>
                )}
              </div>
            </div>

            {/* Column 3: Right - Live Clock Ticker */}
            <div className="font-mono text-right flex flex-col justify-end items-end">
              <span className="text-[9px] text-terminal-muted uppercase block border-b border-terminal-border/20 pb-0.5 mb-1.5 w-full">CLOCK</span>
              <div className="min-h-[32px] flex items-center justify-end">
                <span ref={timerRef} className="text-2xl md:text-3xl font-black text-terminal-text tracking-wide">
                  0.000s
                </span>
              </div>
            </div>
          </div>

          {/* Price arrows delta display */}
          {priceTrainingEnabled && priceAdjustment !== undefined && (
            <div className="border-t border-terminal-border/60 pt-2.5 flex justify-between items-center font-mono text-xs">
              <span className="text-terminal-muted">YOUR ADJUSTED DELTA:</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm px-2.5 py-0.5 bg-terminal-bg border border-terminal-border ${
                  userPriceAdjustment === priceAdjustment ? 'text-success-green border-success-green/20' : 'text-terminal-text'
                }`}>
                  {formatPriceAdjustment(userPriceAdjustment)}
                </span>
                <span className="text-[10px] text-terminal-muted">(←/→)</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Simple, Non-Distracting Result / Feedback Status Line */}
        {feedback && (
          <div className="mt-2.5 py-2 px-3 border border-terminal-border bg-terminal-bg flex justify-between items-center text-xs font-mono">
            <span className={`font-black uppercase tracking-wider ${feedback.correct ? 'text-success-green' : 'text-error-red'}`}>
              {feedback.isTimeout ? 'TIMEOUT (MISSED PRINT)' : feedback.correct ? 'CORRECT EXECUTION' : 'EXECUTION FAILURE'}
            </span>
            <span className="text-terminal-muted text-[10px]">
              {feedback.correct 
                ? `LATENCY: ${(feedback.reactionTimeMs / 1000).toFixed(3)}s`
                : `EXPECTED: ${feedback.expectedEcn} ${priceTrainingEnabled && feedback.expectedPrice !== undefined ? `at ${feedback.expectedPrice > 0 ? '+' : ''}${feedback.expectedPrice}¢` : ''}`
              }
            </span>
          </div>
        )}

        {/* 4. Pause Status Overlay */}
        {sessionState === 'PAUSED' && (
          <div className="absolute inset-0 bg-terminal-bg/85 border border-terminal-border flex flex-col items-center justify-center gap-3 z-10">
            <h3 className="text-2xl font-black font-mono tracking-widest text-warning-amber">
              SESSION PAUSED
            </h3>
            <p className="text-xs font-mono text-terminal-muted">
              Clock is frozen. Submit and route inputs are blocked.
            </p>
          </div>
        )}
      </div>

      {/* Control Layout Hints */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-mono text-terminal-muted">
        <div className="bg-terminal-panel border border-terminal-border p-2">
          <span className="text-[9px] block uppercase text-terminal-muted/60">SUBMIT</span>
          <span className="text-terminal-text font-bold uppercase">{submissionMethod}</span>
        </div>
        <div className="bg-terminal-panel border border-terminal-border p-2">
          <span className="text-[9px] block uppercase text-terminal-muted/60">RESET STROKE</span>
          <span className="text-terminal-text font-bold">SPACE</span>
        </div>
        <div className="bg-terminal-panel border border-terminal-border p-2">
          <span className="text-[9px] block uppercase text-terminal-muted/60">CLEAR ALL</span>
          <span className="text-terminal-text font-bold uppercase">{cancelMethod}</span>
        </div>
        <div className="bg-terminal-panel border border-terminal-border p-2">
          <span className="text-[9px] block uppercase text-terminal-muted/60">PRICE SCALE</span>
          <span className="text-terminal-text font-bold">← / →</span>
        </div>
      </div>

      {/* 5. Session Stats (Audit log) */}
      <div className="bg-terminal-panel border border-terminal-border p-4 font-mono text-lg md:text-xl text-terminal-text flex justify-between items-center">
        <div>
          <span className="text-[10px] block uppercase text-terminal-muted">Current Accuracy</span>
          <span className="font-bold">
            {currentSessionEvents.length > 0
              ? `${((currentSessionEvents.filter((e) => e.correct).length / currentSessionEvents.length) * 100).toFixed(1)}%`
              : '100.0%'}
          </span>
        </div>
        <div>
          <span className="text-[10px] block uppercase text-terminal-muted text-center">Completed</span>
          <span className="font-bold block text-center">
            {currentSessionEvents.length}
          </span>
        </div>
        <div>
          <span className="text-[10px] block uppercase text-terminal-muted text-right">Avg Reaction</span>
          <span className="font-bold text-info-blue block text-right">
            {currentSessionEvents.length > 0
              ? `${(currentSessionEvents.reduce((acc, e) => acc + e.reactionTimeMs, 0) / currentSessionEvents.length / 1000).toFixed(3)}s`
              : '0.000s'}
          </span>
        </div>
      </div>

      {/* Keyboard monitor debug logs */}
      <div className="bg-terminal-panel border border-terminal-border p-2.5 font-mono text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-terminal-text uppercase font-bold text-[10px] tracking-wider">
            [DEBUG_PANEL] - KEYBOARD MONITOR
          </span>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-2 py-0.5 bg-terminal-border text-[10px] hover:bg-terminal-border/80 border border-terminal-border text-terminal-text cursor-pointer"
          >
            {showDebug ? 'HIDE DETAILS' : 'SHOW DETAILS'}
          </button>
        </div>

        {showDebug && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-[11px] border-t border-terminal-border/50">
            <div>
              <span className="text-terminal-muted block text-[9px] uppercase">event.code:</span>
              <strong className="text-terminal-text font-bold">{lastPhysicalKey || 'None'}</strong>
            </div>
            <div>
              <span className="text-terminal-muted block text-[9px] uppercase">event.key:</span>
              <strong className="text-terminal-text font-bold">{lastKeyVal || 'None'}</strong>
            </div>
            <div>
              <span className="text-terminal-muted block text-[9px] uppercase">Shift Held:</span>
              <strong className={lastShiftHeld ? 'text-success-green font-bold' : 'text-error-red font-bold'}>
                {lastShiftHeld.toString().toUpperCase()}
              </strong>
            </div>
            <div className="col-span-2">
              <span className="text-terminal-muted block text-[9px] uppercase">Buffer Sequence:</span>
              <strong className="text-info-blue font-bold">
                {inputSequence.length > 0 ? inputSequence.join(' + ') : 'Empty'}
              </strong>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Trainer;
