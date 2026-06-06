import React, { useRef } from 'react';
import { useTrainerStore } from '../store/trainerStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { useLiveTimer } from '../hooks/useLiveTimer';
import { getTargetKeyAndPresses, processInput } from '../core/routing';
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
    examModeEnabled,
    focusDrillEnabled,
    focusDrillEcns,
    submissionMethod,
    cancelMethod,
    maxPriceAdjustment,

    // Debug states
    lastPhysicalKey,
    lastKeyVal,
    lastShiftHeld,

    // Actions
    updateSettings,
    toggleFocusDrillEcn,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    resetSession,
    setView
  } = useTrainerStore();

  const timerRef = useRef<HTMLSpanElement>(null);
  
  // Activate high-resolution clock updating directly on the DOM ref
  useLiveTimer(timerRef, startTime, sessionState, accumulatedElapsedMs);

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
    if (!e.correct) {
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
      <div className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn">
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
              <div className="flex flex-wrap gap-3">
                {[10, 25, 50, 100, 0].map((count) => (
                  <button
                    key={count}
                    onClick={() => updateSettings({ sessionLength: count })}
                    className={`px-2.5 py-1 font-mono text-xs border cursor-pointer ${
                      sessionLength === count 
                        ? 'bg-info-blue border-info-blue text-terminal-bg font-black' 
                        : 'border-terminal-border text-terminal-muted hover:border-terminal-muted'
                    }`}
                  >
                    {count === 0 ? 'Unlimited' : count}
                  </button>
                ))}
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
                    checked={examModeEnabled}
                    onChange={(e) => updateSettings({ examModeEnabled: e.target.checked })}
                    className="accent-info-blue"
                  />
                  Exam Mode
                </label>
                <label className="flex items-center gap-2 text-xs font-mono text-terminal-text cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={focusDrillEnabled}
                    onChange={(e) => updateSettings({ focusDrillEnabled: e.target.checked })}
                    className="accent-info-blue"
                  />
                  Focus Drill Only
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

            <button
              onClick={startSession}
              className="w-full py-3 bg-success-green hover:bg-success-green/90 text-terminal-bg text-sm font-black font-mono tracking-wider cursor-pointer border-0 uppercase"
            >
              Start Simulator Run
            </button>
          </div>

          {/* ECN Focus Drill list */}
          <div className="md:col-span-6 bg-terminal-panel border border-terminal-border p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              FOCUS DRILL ECN SELECTION
            </h3>
            <p className="text-[10px] font-mono text-terminal-muted leading-tight">
              Toggle specific target routes. If "Focus Drill Only" is enabled, options are restricted to your checked ECN selection.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {ALL_ECNS.map((ecn) => {
                const checked = focusDrillEcns.includes(ecn);
                return (
                  <label
                    key={ecn}
                    onClick={() => toggleFocusDrillEcn(ecn)}
                    className={`p-1.5 border text-center font-mono text-xs cursor-pointer select-none transition-colors ${
                      checked 
                        ? 'bg-info-blue/10 border-info-blue text-info-blue font-bold' 
                        : 'bg-terminal-bg border-terminal-border text-terminal-muted hover:border-terminal-muted'
                    }`}
                  >
                    {ecn}
                  </label>
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
      <div className="w-full max-w-3xl mx-auto space-y-5 animate-fadeIn">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Main stats matrix */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
              PERFORMANCE SNAPSHOT
            </h3>
            <div className="flex justify-between py-1.5 border-b border-terminal-border/30">
              <span className="text-terminal-muted">Total Prompts:</span>
              <span className="text-terminal-text font-bold">{totalPrompts}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-terminal-border/30">
              <span className="text-terminal-muted">Correct Submissions:</span>
              <span className="text-success-green font-bold">{correctPrompts}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-terminal-border/30">
              <span className="text-terminal-muted">Incorrect Slips:</span>
              <span className="text-error-red font-bold">{incorrectPrompts}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-terminal-border/30">
              <span className="text-terminal-muted">Final Accuracy:</span>
              <span className={`font-black ${finalAccuracy >= 90 ? 'text-success-green' : finalAccuracy >= 75 ? 'text-warning-amber' : 'text-error-red'}`}>
                {finalAccuracy.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-terminal-border/30">
              <span className="text-terminal-muted">Average Reaction:</span>
              <span className="text-info-blue font-bold">{(averageTimeMs / 1000).toFixed(3)}s</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-terminal-border/30">
              <span className="text-terminal-muted">Fastest Latency:</span>
              <span className="text-terminal-text">{(fastestTimeMs / 1000).toFixed(3)}s</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-terminal-muted">Slowest Latency:</span>
              <span className="text-terminal-text">{(slowestTimeMs / 1000).toFixed(3)}s</span>
            </div>
          </div>

          {/* Mismatch & Mistakes matrix */}
          <div className="bg-terminal-panel border border-terminal-border p-4 space-y-4 font-mono text-xs">
            <div>
              <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
                MOST COMMON MISMATCHES
              </h3>
              {sortedMistakes.length === 0 ? (
                <p className="text-[11px] text-success-green py-2 font-bold uppercase">No incorrect keystrokes recorded!</p>
              ) : (
                <div className="space-y-1.5 pt-2">
                  {sortedMistakes.map((m, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>Expected <strong className="text-success-green">{m.expected}</strong> → Got <strong className="text-error-red">{m.actual}</strong></span>
                      <span className="text-terminal-muted">({m.count} times)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-terminal-text border-b border-terminal-border pb-2 uppercase tracking-wide">
                {"WEAKEST DESTINATIONS (<100% ACC)"}
              </h3>
              {weakestEcns.length === 0 ? (
                <p className="text-[11px] text-success-green py-2 font-bold uppercase">100% accuracy across all ECNs!</p>
              ) : (
                <div className="space-y-1.5 pt-2">
                  {weakestEcns.map((w, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="font-bold text-terminal-text">{w.ecn}</span>
                      <span className="text-error-red">{w.accuracy.toFixed(1)}% accuracy ({w.correct}/{w.total})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action control bar */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              // Set state back to IDLE to configure and start again
              useTrainerStore.setState({ sessionState: 'IDLE' });
            }}
            className="flex-1 py-3 bg-success-green hover:bg-success-green/90 text-terminal-bg text-sm font-black font-mono tracking-wider cursor-pointer border-0 uppercase text-center"
          >
            Start New Session
          </button>
          <button
            onClick={() => {
              // Set state back to IDLE and navigate to analytics page
              useTrainerStore.setState({ sessionState: 'IDLE' });
              setView('analytics');
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
  const isBuy = action === 'BUY';
  const targetInfo = getTargetKeyAndPresses(action, ecn, keyBindings);

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
    <div className="w-full max-w-3xl mx-auto space-y-5 animate-fadeIn relative">
      {/* Top Session Control Bar */}
      <div className="bg-terminal-panel border border-terminal-border p-3.5 flex justify-between items-center text-xs font-mono">
        <div className="flex gap-4 text-terminal-muted">
          <span>PROGRESS: <strong className="text-terminal-text">{sessionLength > 0 ? `${currentSessionEvents.length + 1} / ${sessionLength}` : `${currentSessionEvents.length + 1} (Infinite)`}</strong></span>
          <span>MODE: <strong className="text-terminal-text uppercase">{mode}</strong></span>
          <span>PRICE: <strong className="text-terminal-text">{priceTrainingEnabled ? 'ON' : 'OFF'}</strong></span>
          <span>EXAM: <strong className="text-terminal-text">{examModeEnabled ? 'ACTIVE' : 'OFF'}</strong></span>
        </div>
        <div className="flex gap-2.5">
          {sessionState === 'RUNNING' ? (
            <button
              onClick={pauseSession}
              disabled={examModeEnabled}
              className="px-3 py-1 bg-warning-amber/10 border border-warning-amber/30 hover:bg-warning-amber/20 text-warning-amber font-mono text-[11px] uppercase cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={resumeSession}
              className="px-3 py-1 bg-success-green/10 border border-success-green/30 hover:bg-success-green/20 text-success-green font-mono text-[11px] uppercase cursor-pointer"
            >
              Resume
            </button>
          )}
          <button
            onClick={resetSession}
            className="px-3 py-1 bg-terminal-border hover:bg-terminal-border/80 border border-terminal-border text-terminal-text font-mono text-[11px] uppercase cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => endSession(false)}
            className="px-3 py-1 bg-error-red/10 border border-error-red/30 hover:bg-error-red/20 text-error-red font-mono text-[11px] uppercase cursor-pointer"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main Focus Training Layout Chamber */}
      <div className="bg-terminal-panel border border-terminal-border p-8 min-h-[360px] flex flex-col justify-between relative">
        <div className={`absolute top-0 left-0 right-0 h-1 ${isBuy ? 'bg-info-blue' : 'bg-error-red'}`} />

        {/* 1. Large Prompt Element (Dominates Screen) */}
        <div className="text-center py-8 space-y-4 select-none font-mono">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white uppercase">
            {action} {ecn}
          </h1>

          {priceTrainingEnabled && priceAdjustment !== undefined && (
            <div className={`text-4xl md:text-5xl font-black ${priceAdjustment > 0 ? 'text-success-green' : 'text-error-red'}`}>
              {priceAdjustment > 0 ? `+${priceAdjustment}` : priceAdjustment}¢
            </div>
          )}
        </div>

        {/* 2. Live Input buffer */}
        <div className="bg-terminal-bg border border-terminal-border p-4 space-y-3 relative">
          <div className="flex justify-between items-center text-[10px] font-mono text-terminal-muted uppercase border-b border-terminal-border pb-1">
            <span>LIVE INPUT SEQUENCE</span>
            <span>CLOCK</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <div className="font-mono">
              <div className="flex items-center gap-2 min-h-[32px]">
                {inputSequence.length === 0 ? (
                  <span className="text-sm text-terminal-muted italic">HOLD SHIFT + PRESS ROUTE KEY</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="px-2 py-1 bg-terminal-border text-xs font-bold text-terminal-text">SHIFT</span>
                    <span className="text-terminal-muted text-xs font-bold">+</span>
                    {inputSequence.map((code, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-terminal-muted text-xs font-bold">+</span>}
                        <span className="px-2 py-1 bg-terminal-border text-xs font-bold text-info-blue">
                          {formatInputKeyName(code)}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-terminal-muted mt-2 font-bold">
                {resolvedEcn ? (
                  <span className={resolvedEcn === ecn ? 'text-success-green' : 'text-error-red'}>
                    RESOLVED TARGET: {resolvedEcn} ({pressCount} presses)
                  </span>
                ) : (
                  <span>NO ROUTE ACTIVE</span>
                )}
              </div>
            </div>

            {/* Live Clock Ticker */}
            <div>
              <span ref={timerRef} className="text-2xl md:text-3xl font-black font-mono text-terminal-text">
                0.000s
              </span>
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

        {/* 3. Result / Feedback Overlay */}
        {!examModeEnabled && feedback && (
          <div className="absolute inset-0 bg-terminal-bg border border-terminal-border flex flex-col items-center justify-center gap-4 z-20">
            <h3 className={`text-2xl font-black font-mono tracking-widest ${feedback.correct ? 'text-success-green' : 'text-error-red'}`}>
              {feedback.correct ? 'CORRECT EXECUTION' : 'EXECUTION FAILURE'}
            </h3>
            <div className="bg-terminal-panel border border-terminal-border p-4 space-y-2 text-xs font-mono text-left w-80">
              <div className="flex justify-between">
                <span className="text-terminal-muted">Expected ECN:</span>
                <span className="text-success-green font-bold">
                  {feedback.expectedEcn} {targetInfo ? `(Shift+${formatInputKeyName(targetInfo.key)} x${targetInfo.expectedPresses})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Resolved Input:</span>
                <span className={`font-bold ${feedback.expectedEcn === feedback.actualEcn ? 'text-success-green' : 'text-error-red'}`}>
                  {feedback.actualEcn}
                </span>
              </div>
              {priceTrainingEnabled && (
                <>
                  <div className="flex justify-between border-t border-terminal-border pt-2 mt-2">
                    <span className="text-terminal-muted">Expected Price:</span>
                    <span className="text-success-green font-bold">
                      {feedback.expectedPrice !== undefined && feedback.expectedPrice > 0 ? '+' : ''}
                      {feedback.expectedPrice}¢
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Your Price Entry:</span>
                    <span className={`font-bold ${feedback.priceCorrect ? 'text-success-green' : 'text-error-red'}`}>
                      {feedback.actualPrice !== undefined && feedback.actualPrice > 0 ? '+' : ''}
                      {feedback.actualPrice}¢
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-terminal-border pt-2 mt-2 text-terminal-muted">
                <span>Latency:</span>
                <span>{(feedback.reactionTimeMs / 1000).toFixed(3)}s</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Pause Status Overlay */}
        {sessionState === 'PAUSED' && (
          <div className="absolute inset-0 bg-terminal-bg/80 border border-terminal-border flex flex-col items-center justify-center gap-3 z-10">
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
      {!examModeEnabled && (
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
      )}

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
