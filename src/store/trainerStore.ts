import { create } from 'zustand';
import type { Prompt, ECN, ActionType, SessionEvent, Session, ECNWeightMap, KeyBindings } from '../types';
import { processInput } from '../core/routing';
import { adjustEcnWeight, initializeEcnWeights, selectNextEcn, computePerformanceWeights } from '../core/learning';
import {
  loadSessionsFromStorage,
  saveSessionsToStorage,
  loadWeightsFromStorage,
  saveWeightsToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage
} from '../core/storage';
import type { AppSettings } from '../core/storage';

interface TrainerState {
  // Navigation & View
  currentView: 'dashboard' | 'trainer' | 'analytics' | 'settings';

  // Settings (synced to storage)
  mode: 'buy_only' | 'sell_only' | 'mixed';
  priceTrainingEnabled: boolean;
  smartLearningEnabled: boolean;
  targetEcnModeEnabled: boolean;
  targetEcns: ECN[];
  sessionLength: number;
  submissionMethod: 'Enter' | 'ShiftEnter';
  cancelMethod: 'Escape' | 'ShiftEscape';
  keyBindings: KeyBindings;
  trackResets: boolean;
  trackOvershoots: boolean;
  trackRecoveries: boolean;
  maxPriceAdjustment: 1 | 3 | 5 | 10;
  practiceModeType: 'stable' | 'time_limit';
  adaptivePacingEnabled: boolean;
  feedbackDelayMs: number;
  initialTimeLimitMs: number;
  speedDecayMs: number;
  speedPenaltyMs: number;
  targetStreakLength: number;

  // Session state machine
  sessionState: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'TERMINATED';
  isSessionActive: boolean; // keep for backward compatibility
  currentPrompt: Prompt | null;
  inputSequence: string[];
  activeRouteKey: string | null; // event.code
  pressCount: number;
  userPriceAdjustment: number;
  startTime: number | null;
  accumulatedElapsedMs: number;
  pausedTime: number | null;
  sessionStartTime: number | null;
  sessionTotalPausedTime: number;
  feedback: {
    correct: boolean;
    priceCorrect?: boolean;
    expectedEcn: ECN;
    actualEcn: ECN;
    expectedPrice?: number;
    actualPrice?: number;
    reactionTimeMs: number;
    isTimeout?: boolean;
  } | null;

  // Session metrics
  currentSessionEvents: SessionEvent[];
  spaceResetsInCurrentPrompt: number;
  overshootsInCurrentPrompt: number;
  wrapsInCurrentPrompt: number;
  recoveriesInCurrentPrompt: number;

  // Run-time pacing state
  countdownRemaining: number | null;
  currentTimeLimitMs: number;
  consecutiveCorrectCount: number;
  missedCount: number;

  // Persistent data cache
  sessions: Session[];
  ecnWeights: ECNWeightMap;

  // Keyboard debug info
  lastPhysicalKey: string;
  lastKeyVal: string;
  lastShiftHeld: boolean;

  // Navigation actions
  setView: (view: 'dashboard' | 'trainer' | 'analytics' | 'settings') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setTargetEcns: (ecns: ECN[]) => void;
  setDebugInfo: (code: string, key: string, shift: boolean) => void;

  // Session controls
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: (completed?: boolean) => void;
  resetSession: () => void;
  resetToIdle: () => void;
  nextPrompt: () => void;
  handleTimeout: () => void;

  // Keyboard interactions
  pressRouteKey: (code: string) => void;
  adjustPrice: (delta: number) => void;
  submitAnswer: () => void;
  resetPromptInput: () => void; // Spacebar
  clearPromptInput: () => void; // Esc

  // Cleanup
  clearHistory: () => void;
}

const savedSettings = loadSettingsFromStorage();

export const useTrainerStore = create<TrainerState>((set, get) => ({
  // Navigation & View
  currentView: 'dashboard',

  // Settings
  mode: savedSettings.mode,
  priceTrainingEnabled: savedSettings.priceTrainingEnabled,
  smartLearningEnabled: savedSettings.smartLearningEnabled,
  targetEcnModeEnabled: savedSettings.targetEcnModeEnabled,
  targetEcns: savedSettings.targetEcns,
  sessionLength: savedSettings.sessionLength,
  submissionMethod: savedSettings.submissionMethod,
  cancelMethod: savedSettings.cancelMethod,
  keyBindings: savedSettings.keyBindings,
  trackResets: savedSettings.trackResets,
  trackOvershoots: savedSettings.trackOvershoots,
  trackRecoveries: savedSettings.trackRecoveries,
  maxPriceAdjustment: savedSettings.maxPriceAdjustment,
  practiceModeType: savedSettings.practiceModeType,
  adaptivePacingEnabled: savedSettings.adaptivePacingEnabled,
  feedbackDelayMs: savedSettings.feedbackDelayMs,
  initialTimeLimitMs: savedSettings.initialTimeLimitMs,
  speedDecayMs: savedSettings.speedDecayMs,
  speedPenaltyMs: savedSettings.speedPenaltyMs,
  targetStreakLength: savedSettings.targetStreakLength,

  // Session state
  sessionState: 'IDLE',
  isSessionActive: false,
  currentPrompt: null,
  inputSequence: [],
  activeRouteKey: null,
  pressCount: 0,
  userPriceAdjustment: 0,
  startTime: null,
  accumulatedElapsedMs: 0,
  pausedTime: null,
  sessionStartTime: null,
  sessionTotalPausedTime: 0,
  feedback: null,

  // Session metrics
  currentSessionEvents: [],
  spaceResetsInCurrentPrompt: 0,
  overshootsInCurrentPrompt: 0,
  wrapsInCurrentPrompt: 0,
  recoveriesInCurrentPrompt: 0,

  // Run-time pacing state
  countdownRemaining: null,
  currentTimeLimitMs: savedSettings.initialTimeLimitMs,
  consecutiveCorrectCount: 0,
  missedCount: 0,

  // Persistent data cache
  sessions: loadSessionsFromStorage(),
  ecnWeights: loadWeightsFromStorage(),

  // Keyboard debug info
  lastPhysicalKey: '',
  lastKeyVal: '',
  lastShiftHeld: false,

  // View control
  setView: (view) => set({ currentView: view }),

  // Update Settings and sync to localStorage
  updateSettings: (newSettings) => {
    set((state) => {
      const updated = {
        mode: newSettings.mode !== undefined ? newSettings.mode : state.mode,
        priceTrainingEnabled: newSettings.priceTrainingEnabled !== undefined ? newSettings.priceTrainingEnabled : state.priceTrainingEnabled,
        smartLearningEnabled: newSettings.smartLearningEnabled !== undefined ? newSettings.smartLearningEnabled : state.smartLearningEnabled,
        targetEcnModeEnabled: newSettings.targetEcnModeEnabled !== undefined ? newSettings.targetEcnModeEnabled : state.targetEcnModeEnabled,
        targetEcns: newSettings.targetEcns !== undefined ? newSettings.targetEcns : state.targetEcns,
        sessionLength: newSettings.sessionLength !== undefined ? newSettings.sessionLength : state.sessionLength,
        submissionMethod: newSettings.submissionMethod !== undefined ? newSettings.submissionMethod : state.submissionMethod,
        cancelMethod: newSettings.cancelMethod !== undefined ? newSettings.cancelMethod : state.cancelMethod,
        keyBindings: newSettings.keyBindings !== undefined ? newSettings.keyBindings : state.keyBindings,
        trackResets: newSettings.trackResets !== undefined ? newSettings.trackResets : state.trackResets,
        trackOvershoots: newSettings.trackOvershoots !== undefined ? newSettings.trackOvershoots : state.trackOvershoots,
        trackRecoveries: newSettings.trackRecoveries !== undefined ? newSettings.trackRecoveries : state.trackRecoveries,
        maxPriceAdjustment: newSettings.maxPriceAdjustment !== undefined ? newSettings.maxPriceAdjustment : state.maxPriceAdjustment,
        practiceModeType: newSettings.practiceModeType !== undefined ? newSettings.practiceModeType : state.practiceModeType,
        adaptivePacingEnabled: newSettings.adaptivePacingEnabled !== undefined ? newSettings.adaptivePacingEnabled : state.adaptivePacingEnabled,
        feedbackDelayMs: newSettings.feedbackDelayMs !== undefined ? newSettings.feedbackDelayMs : state.feedbackDelayMs,
        initialTimeLimitMs: newSettings.initialTimeLimitMs !== undefined ? newSettings.initialTimeLimitMs : state.initialTimeLimitMs,
        speedDecayMs: newSettings.speedDecayMs !== undefined ? newSettings.speedDecayMs : state.speedDecayMs,
        speedPenaltyMs: newSettings.speedPenaltyMs !== undefined ? newSettings.speedPenaltyMs : state.speedPenaltyMs,
        targetStreakLength: newSettings.targetStreakLength !== undefined ? newSettings.targetStreakLength : state.targetStreakLength
      };

      saveSettingsToStorage({
        mode: updated.mode,
        priceTrainingEnabled: updated.priceTrainingEnabled,
        smartLearningEnabled: updated.smartLearningEnabled,
        targetEcnModeEnabled: updated.targetEcnModeEnabled,
        targetEcns: updated.targetEcns,
        sessionLength: updated.sessionLength,
        submissionMethod: updated.submissionMethod,
        cancelMethod: updated.cancelMethod,
        keyBindings: updated.keyBindings,
        trackResets: updated.trackResets,
        trackOvershoots: updated.trackOvershoots,
        trackRecoveries: updated.trackRecoveries,
        maxPriceAdjustment: updated.maxPriceAdjustment,
        practiceModeType: updated.practiceModeType,
        adaptivePacingEnabled: updated.adaptivePacingEnabled,
        feedbackDelayMs: updated.feedbackDelayMs,
        initialTimeLimitMs: updated.initialTimeLimitMs,
        speedDecayMs: updated.speedDecayMs,
        speedPenaltyMs: updated.speedPenaltyMs,
        targetStreakLength: updated.targetStreakLength
      });

      return updated;
    });
  },

  setTargetEcns: (ecns) => {
    get().updateSettings({ targetEcns: ecns });
  },

  setDebugInfo: (code, key, shift) => {
    set({
      lastPhysicalKey: code,
      lastKeyVal: key,
      lastShiftHeld: shift
    });
  },

  // Session Control Actions
  startSession: () => {
    const sessions = loadSessionsFromStorage();
    const ecnWeights = computePerformanceWeights(sessions);
    const initialTimeLimitMs = get().initialTimeLimitMs;

    set({
      sessions,
      ecnWeights,
      sessionState: 'RUNNING',
      isSessionActive: true,
      currentSessionEvents: [],
      currentView: 'trainer',
      feedback: null,
      accumulatedElapsedMs: 0,
      pausedTime: null,
      sessionStartTime: Date.now(),
      sessionTotalPausedTime: 0,
      lastPhysicalKey: '',
      lastKeyVal: '',
      lastShiftHeld: false,
      countdownRemaining: 3,
      consecutiveCorrectCount: 0,
      missedCount: 0,
      currentTimeLimitMs: initialTimeLimitMs
    });

    get().nextPrompt();
    set({ startTime: null }); // Don't run timer during countdown
  },

  pauseSession: () => {
    const { sessionState, startTime, countdownRemaining } = get();
    if (sessionState !== 'RUNNING' || countdownRemaining !== null || startTime === null) return;

    set({
      pausedTime: Date.now(),
      accumulatedElapsedMs: get().accumulatedElapsedMs + (Date.now() - startTime),
      sessionState: 'PAUSED',
      startTime: null
    });
  },

  resumeSession: () => {
    const { sessionState, countdownRemaining, pausedTime, sessionTotalPausedTime } = get();
    if (sessionState !== 'PAUSED' || countdownRemaining !== null) return;

    const pauseDur = pausedTime ? Date.now() - pausedTime : 0;

    set({
      startTime: Date.now(),
      pausedTime: null,
      sessionState: 'RUNNING',
      sessionTotalPausedTime: sessionTotalPausedTime + pauseDur
    });
  },

  endSession: (completed = false) => {
    const {
      currentSessionEvents,
      mode,
      priceTrainingEnabled,
      smartLearningEnabled,
      sessions,
      isSessionActive,
      sessionStartTime,
      sessionTotalPausedTime,
      pausedTime,
      targetEcnModeEnabled,
      targetEcns,
      practiceModeType,
      initialTimeLimitMs,
      speedDecayMs,
      speedPenaltyMs,
      targetStreakLength
    } = get();
    if (!isSessionActive) return;

    const targetState = completed ? 'COMPLETED' : 'TERMINATED';

    if (currentSessionEvents.length === 0) {
      set({
        sessionState: targetState,
        isSessionActive: false,
        currentPrompt: null
      });
      return;
    }

    const correctEvents = currentSessionEvents.filter((e) => e.correct);
    const accuracy = (correctEvents.length / currentSessionEvents.length) * 100;
    const averageTime = currentSessionEvents.reduce((acc, e) => acc + e.reactionTimeMs, 0) / currentSessionEvents.length;

    const reactionTimes = currentSessionEvents.map((e) => e.reactionTimeMs);
    const fastestTime = Math.min(...reactionTimes);
    const slowestTime = Math.max(...reactionTimes);
    const overshootCount = currentSessionEvents.reduce((sum, e) => sum + e.metrics.overshoots, 0);
    const resetCount = currentSessionEvents.reduce((sum, e) => sum + e.metrics.spaceResets, 0);

    let priceAccuracy: number | undefined;
    if (priceTrainingEnabled) {
      const priceEvents = currentSessionEvents.filter((e) => e.expectedPriceAdjustment !== undefined);
      if (priceEvents.length > 0) {
        priceAccuracy = (priceEvents.filter((e) => e.priceCorrect).length / priceEvents.length) * 100;
      }
    }

    const mistakeCounts: Record<string, { expected: ECN; actual: string; count: number }> = {};
    currentSessionEvents.forEach((e) => {
      if (!e.correct) {
        const actualVal = e.actualEcn || 'None';
        const key = `${e.expectedEcn} -> ${actualVal}`;
        if (!mistakeCounts[key]) {
          mistakeCounts[key] = { expected: e.expectedEcn, actual: actualVal, count: 0 };
        }
        mistakeCounts[key].count += 1;
      }
    });
    const mistakeMatrix = Object.values(mistakeCounts).sort((a, b) => b.count - a.count);

    let finalTotalPausedTime = sessionTotalPausedTime;
    if (pausedTime) {
      finalTotalPausedTime += (Date.now() - pausedTime);
    }
    const sessionDurationMs = sessionStartTime ? (Date.now() - sessionStartTime - finalTotalPausedTime) : 0;

    const newSession: Session = {
      id: Math.random().toString(36).substring(2, 11),
      date: new Date().toISOString(),
      mode,
      priceTrainingEnabled,
      smartLearningEnabled,
      accuracy,
      averageTime,
      events: currentSessionEvents,
      fastestTime,
      slowestTime,
      overshootCount,
      resetCount,
      priceAccuracy,
      mistakeMatrix,
      targetEcnModeEnabled,
      targetEcns,
      targetEcn: targetEcns?.[0] || null, // backward compatibility
      practiceModeType,
      initialTimeLimitMs,
      speedDecayMs,
      speedPenaltyMs,
      targetStreakLength,
      repetitionThreshold: 3,
      sessionDurationMs
    };

    const nextSessions = [newSession, ...sessions];
    saveSessionsToStorage(nextSessions);
    saveWeightsToStorage(get().ecnWeights);

    set({
      sessions: nextSessions,
      sessionState: targetState,
      isSessionActive: false,
      currentPrompt: null
    });
  },

  resetSession: () => {
    const initialTimeLimitMs = get().initialTimeLimitMs;
    set({
      currentSessionEvents: [],
      feedback: null,
      sessionState: 'RUNNING',
      accumulatedElapsedMs: 0,
      pausedTime: null,
      countdownRemaining: 3,
      consecutiveCorrectCount: 0,
      missedCount: 0,
      currentTimeLimitMs: initialTimeLimitMs,
      sessionStartTime: Date.now(),
      sessionTotalPausedTime: 0
    });
    get().nextPrompt();
    set({ startTime: null }); // Don't run timer during countdown
  },

  resetToIdle: () => {
    set({
      sessionState: 'IDLE',
      isSessionActive: false,
      currentPrompt: null,
      inputSequence: [],
      activeRouteKey: null,
      pressCount: 0,
      userPriceAdjustment: 0,
      startTime: null,
      accumulatedElapsedMs: 0,
      pausedTime: null,
      sessionStartTime: null,
      sessionTotalPausedTime: 0,
      feedback: null,
      currentSessionEvents: [],
      spaceResetsInCurrentPrompt: 0,
      overshootsInCurrentPrompt: 0,
      wrapsInCurrentPrompt: 0,
      recoveriesInCurrentPrompt: 0,
      countdownRemaining: null,
      consecutiveCorrectCount: 0,
      missedCount: 0
    });
  },

  nextPrompt: () => {
    const { sessionLength, currentSessionEvents, ecnWeights, targetEcnModeEnabled, targetEcns, mode, priceTrainingEnabled } = get();

    // End session automatically if prompt limit is reached
    if (sessionLength > 0 && currentSessionEvents.length >= sessionLength) {
      get().endSession(true);
      return;
    }

    // Determine ECN selection filter
    let ecnFilter: ((ecn: ECN) => boolean) | undefined;
    if (targetEcnModeEnabled && targetEcns && targetEcns.length > 0) {
      ecnFilter = (ecn) => targetEcns.includes(ecn);
    }

    const nextEcn = selectNextEcn(ecnWeights, currentSessionEvents, 3, ecnFilter);

    // Determine Buy/Sell side action
    let nextAction: ActionType;
    if (mode === 'buy_only') {
      nextAction = 'BUY';
    } else if (mode === 'sell_only') {
      nextAction = 'SELL';
    } else {
      nextAction = Math.random() < 0.5 ? 'BUY' : 'SELL';
    }

    // Price mode setup
    let basePrice: number | undefined;
    let priceAdjustment: number | undefined;
    if (priceTrainingEnabled) {
      basePrice = parseFloat((Math.random() * 89 + 10).toFixed(2));
      const max = get().maxPriceAdjustment || 5;
      const adjustments: number[] = [];
      for (let i = 1; i <= max; i++) {
        adjustments.push(i);
        adjustments.push(-i);
      }
      priceAdjustment = adjustments[Math.floor(Math.random() * adjustments.length)];
    }

    set({
      currentPrompt: {
        action: nextAction,
        ecn: nextEcn,
        basePrice,
        priceAdjustment
      },
      inputSequence: [],
      activeRouteKey: null,
      pressCount: 0,
      userPriceAdjustment: 0,
      startTime: Date.now(),
      accumulatedElapsedMs: 0,
      pausedTime: null,
      feedback: null,
      spaceResetsInCurrentPrompt: 0,
      overshootsInCurrentPrompt: 0,
      wrapsInCurrentPrompt: 0,
      recoveriesInCurrentPrompt: 0
    });
  },

  // Input processing
  pressRouteKey: (code) => {
    const { sessionState, feedback, currentPrompt, activeRouteKey, inputSequence, pressCount, spaceResetsInCurrentPrompt, keyBindings } = get();
    if (sessionState !== 'RUNNING' || feedback || !currentPrompt) return;

    const isSameKey = activeRouteKey === code;
    const nextSequence = isSameKey ? [...inputSequence, code] : [code];
    const nextActiveKey = code;
    const nextPressCount = isSameKey ? pressCount + 1 : 1;

    const { metrics } = processInput(
      currentPrompt.action,
      currentPrompt.ecn,
      nextActiveKey,
      nextPressCount,
      spaceResetsInCurrentPrompt,
      keyBindings
    );

    set({
      inputSequence: nextSequence,
      activeRouteKey: nextActiveKey,
      pressCount: nextPressCount,
      overshootsInCurrentPrompt: metrics.overshoots,
      wrapsInCurrentPrompt: metrics.wraps,
      recoveriesInCurrentPrompt: metrics.recoveries
    });
  },

  adjustPrice: (delta) => {
    const { sessionState, feedback, currentPrompt, userPriceAdjustment } = get();
    if (sessionState !== 'RUNNING' || feedback || !currentPrompt) return;

    set({
      userPriceAdjustment: userPriceAdjustment + delta
    });
  },

  submitAnswer: () => {
    const {
      sessionState,
      feedback,
      currentPrompt,
      activeRouteKey,
      pressCount,
      spaceResetsInCurrentPrompt,
      keyBindings,
      accumulatedElapsedMs,
      startTime,
      priceTrainingEnabled,
      userPriceAdjustment,
      smartLearningEnabled,
      ecnWeights,
      currentSessionEvents,
      sessionLength,
      overshootsInCurrentPrompt,
      wrapsInCurrentPrompt,
      recoveriesInCurrentPrompt,
      inputSequence,
      adaptivePacingEnabled,
      currentTimeLimitMs,
      consecutiveCorrectCount,
      speedDecayMs,
      speedPenaltyMs,
      targetStreakLength,
      feedbackDelayMs
    } = get();

    if (sessionState !== 'RUNNING' || feedback || !currentPrompt) return;

    const reactionTimeMs = accumulatedElapsedMs + (Date.now() - (startTime ?? Date.now()));

    // Resolve what the user typed
    let resolvedEcn: ECN | null = null;
    if (activeRouteKey && pressCount > 0) {
      const { currentEcn } = processInput(
        currentPrompt.action,
        currentPrompt.ecn,
        activeRouteKey,
        pressCount,
        spaceResetsInCurrentPrompt,
        keyBindings
      );
      resolvedEcn = currentEcn;
    }

    const ecnCorrect = (() => {
      if (!activeRouteKey || !resolvedEcn) return false;
      const validCodesForAction = currentPrompt.action === 'BUY'
        ? [keyBindings.buyGroupA, keyBindings.buyGroupS, keyBindings.buyGroupD, keyBindings.buyGroupZ, keyBindings.buyGroupX]
        : [keyBindings.sellGroupA, keyBindings.sellGroupS, keyBindings.sellGroupD, keyBindings.sellGroupZ, keyBindings.sellGroupX];
      return validCodesForAction.includes(activeRouteKey) && resolvedEcn === currentPrompt.ecn;
    })();
    const priceCorrect = priceTrainingEnabled ? (userPriceAdjustment === currentPrompt.priceAdjustment) : true;
    const correct = ecnCorrect && priceCorrect;

    // Adjust learning weights if smart learning is active
    if (smartLearningEnabled) {
      const nextWeights = adjustEcnWeight(ecnWeights, currentPrompt.ecn, correct);
      set({ ecnWeights: nextWeights });
    }

    // Adaptive Pacing updates
    let nextTimeLimitMs = currentTimeLimitMs;
    let nextStreak = consecutiveCorrectCount;

    if (correct) {
      nextStreak += 1;
      if (adaptivePacingEnabled && nextStreak % targetStreakLength === 0) {
        nextTimeLimitMs = Math.max(500, currentTimeLimitMs - speedDecayMs);
      }
    } else {
      nextStreak = 0;
      if (adaptivePacingEnabled) {
        nextTimeLimitMs = Math.min(5000, currentTimeLimitMs + speedPenaltyMs);
      }
    }

    set({
      consecutiveCorrectCount: nextStreak,
      currentTimeLimitMs: nextTimeLimitMs
    });

    const event: SessionEvent = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      prompt: currentPrompt,
      expectedEcn: currentPrompt.ecn,
      actualEcn: resolvedEcn || ('None' as ECN),
      action: currentPrompt.action,
      reactionTimeMs,
      usedSpaceReset: spaceResetsInCurrentPrompt > 0,
      keySequence: inputSequence,
      correct,
      priceCorrect: priceTrainingEnabled ? priceCorrect : undefined,
      expectedPriceAdjustment: currentPrompt.priceAdjustment,
      actualPriceAdjustment: priceTrainingEnabled ? userPriceAdjustment : undefined,
      metrics: {
        overshoots: overshootsInCurrentPrompt,
        wraps: wrapsInCurrentPrompt,
        recoveries: recoveriesInCurrentPrompt,
        spaceResets: spaceResetsInCurrentPrompt
      }
    };

    const nextEvents = [...currentSessionEvents, event];

    // Normal practice mode shows correct/incorrect feedback overlays
    set({
      feedback: {
        correct,
        priceCorrect: priceTrainingEnabled ? priceCorrect : undefined,
        expectedEcn: currentPrompt.ecn,
        actualEcn: resolvedEcn || ('None' as ECN),
        expectedPrice: currentPrompt.priceAdjustment,
        actualPrice: userPriceAdjustment,
        reactionTimeMs
      },
      currentSessionEvents: nextEvents
    });

    setTimeout(() => {
      const state = get();
      if (state.sessionState === 'RUNNING' && state.feedback) {
        set({ feedback: null });
        if (sessionLength > 0 && state.currentSessionEvents.length >= sessionLength) {
          get().endSession(true);
        } else {
          get().nextPrompt();
        }
      }
    }, feedbackDelayMs);
  },

  handleTimeout: () => {
    const {
      sessionState,
      feedback,
      currentPrompt,
      currentTimeLimitMs,
      adaptivePacingEnabled,
      speedPenaltyMs,
      feedbackDelayMs,
      currentSessionEvents,
      sessionLength,
      missedCount
    } = get();

    if (sessionState !== 'RUNNING' || feedback || !currentPrompt) return;

    // Timeout is a failure
    const nextTimeLimitMs = adaptivePacingEnabled
      ? Math.min(5000, currentTimeLimitMs + speedPenaltyMs)
      : currentTimeLimitMs;

    set({
      consecutiveCorrectCount: 0,
      currentTimeLimitMs: nextTimeLimitMs,
      missedCount: missedCount + 1
    });

    const event: SessionEvent = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      prompt: currentPrompt,
      expectedEcn: currentPrompt.ecn,
      actualEcn: 'None' as ECN,
      action: currentPrompt.action,
      reactionTimeMs: currentTimeLimitMs,
      usedSpaceReset: false,
      keySequence: [],
      correct: false,
      priceCorrect: false,
      expectedPriceAdjustment: currentPrompt.priceAdjustment,
      actualPriceAdjustment: undefined,
      metrics: {
        overshoots: 0,
        wraps: 0,
        recoveries: 0,
        spaceResets: 0
      }
    };

    const nextEvents = [...currentSessionEvents, event];

    set({
      feedback: {
        correct: false,
        priceCorrect: false,
        expectedEcn: currentPrompt.ecn,
        actualEcn: 'None' as ECN,
        expectedPrice: currentPrompt.priceAdjustment,
        actualPrice: undefined,
        reactionTimeMs: currentTimeLimitMs,
        isTimeout: true
      },
      currentSessionEvents: nextEvents
    });

    setTimeout(() => {
      const state = get();
      if (state.sessionState === 'RUNNING' && state.feedback) {
        set({ feedback: null });
        if (sessionLength > 0 && state.currentSessionEvents.length >= sessionLength) {
          get().endSession(true);
        } else {
          get().nextPrompt();
        }
      }
    }, feedbackDelayMs);
  },

  resetPromptInput: () => {
    const { sessionState, feedback, spaceResetsInCurrentPrompt } = get();
    if (sessionState !== 'RUNNING' || feedback) return;

    set({
      inputSequence: [],
      activeRouteKey: null,
      pressCount: 0,
      spaceResetsInCurrentPrompt: spaceResetsInCurrentPrompt + 1
    });
  },

  clearPromptInput: () => {
    const { sessionState, feedback } = get();
    if (sessionState !== 'RUNNING' || feedback) return;

    set({
      inputSequence: [],
      activeRouteKey: null,
      pressCount: 0,
      userPriceAdjustment: 0
    });
  },

  clearHistory: () => {
    // Clear storage keys
    try {
      localStorage.removeItem('ecn_trainer_sessions');
      localStorage.removeItem('ecn_trainer_weights');
    } catch {
      // Ignore
    }

    set({
      sessions: [],
      ecnWeights: initializeEcnWeights(),
      sessionState: 'IDLE',
      isSessionActive: false,
      currentPrompt: null,
      inputSequence: [],
      activeRouteKey: null,
      pressCount: 0,
      userPriceAdjustment: 0,
      currentSessionEvents: [],
      feedback: null,
      spaceResetsInCurrentPrompt: 0,
      overshootsInCurrentPrompt: 0,
      wrapsInCurrentPrompt: 0,
      recoveriesInCurrentPrompt: 0
    });
  }
}));
