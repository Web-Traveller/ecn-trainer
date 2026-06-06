import { create } from 'zustand';
import type { Prompt, ECN, ActionType, SessionEvent, Session, ECNWeightMap, KeyBindings } from '../types';
import { processInput } from '../core/routing';
import { adjustEcnWeight, initializeEcnWeights, selectNextEcn } from '../core/learning';
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
  currentView: 'dashboard' | 'trainer' | 'analytics' | 'history' | 'settings' | 'docs';

  // Settings (synced to storage)
  mode: 'buy_only' | 'sell_only' | 'mixed';
  priceTrainingEnabled: boolean;
  smartLearningEnabled: boolean;
  examModeEnabled: boolean;
  focusDrillEnabled: boolean;
  focusDrillEcns: ECN[];
  sessionLength: number;
  submissionMethod: 'Enter' | 'ShiftEnter';
  cancelMethod: 'Escape' | 'ShiftEscape';
  keyBindings: KeyBindings;
  soundEnabled: boolean;
  trackResets: boolean;
  trackOvershoots: boolean;
  trackRecoveries: boolean;
  maxPriceAdjustment: 1 | 3 | 5 | 10;

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
  feedback: {
    correct: boolean;
    priceCorrect?: boolean;
    expectedEcn: ECN;
    actualEcn: ECN;
    expectedPrice?: number;
    actualPrice?: number;
    reactionTimeMs: number;
  } | null;

  // Session metrics
  currentSessionEvents: SessionEvent[];
  spaceResetsInCurrentPrompt: number;
  overshootsInCurrentPrompt: number;
  wrapsInCurrentPrompt: number;
  recoveriesInCurrentPrompt: number;

  // Persistent data cache
  sessions: Session[];
  ecnWeights: ECNWeightMap;

  // Keyboard debug info
  lastPhysicalKey: string;
  lastKeyVal: string;
  lastShiftHeld: boolean;

  // Navigation actions
  setView: (view: 'dashboard' | 'trainer' | 'analytics' | 'history' | 'settings' | 'docs') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleFocusDrillEcn: (ecn: ECN) => void;
  setDebugInfo: (code: string, key: string, shift: boolean) => void;

  // Session controls
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: (completed?: boolean) => void;
  resetSession: () => void;
  nextPrompt: () => void;

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
  examModeEnabled: savedSettings.examModeEnabled,
  focusDrillEnabled: savedSettings.focusDrillEnabled,
  focusDrillEcns: savedSettings.focusDrillEcns,
  sessionLength: savedSettings.sessionLength,
  submissionMethod: savedSettings.submissionMethod,
  cancelMethod: savedSettings.cancelMethod,
  keyBindings: savedSettings.keyBindings,
  soundEnabled: savedSettings.soundEnabled,
  trackResets: savedSettings.trackResets,
  trackOvershoots: savedSettings.trackOvershoots,
  trackRecoveries: savedSettings.trackRecoveries,
  maxPriceAdjustment: savedSettings.maxPriceAdjustment,

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
  feedback: null,

  // Session metrics
  currentSessionEvents: [],
  spaceResetsInCurrentPrompt: 0,
  overshootsInCurrentPrompt: 0,
  wrapsInCurrentPrompt: 0,
  recoveriesInCurrentPrompt: 0,

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
        examModeEnabled: newSettings.examModeEnabled !== undefined ? newSettings.examModeEnabled : state.examModeEnabled,
        focusDrillEnabled: newSettings.focusDrillEnabled !== undefined ? newSettings.focusDrillEnabled : state.focusDrillEnabled,
        focusDrillEcns: newSettings.focusDrillEcns !== undefined ? newSettings.focusDrillEcns : state.focusDrillEcns,
        sessionLength: newSettings.sessionLength !== undefined ? newSettings.sessionLength : state.sessionLength,
        submissionMethod: newSettings.submissionMethod !== undefined ? newSettings.submissionMethod : state.submissionMethod,
        cancelMethod: newSettings.cancelMethod !== undefined ? newSettings.cancelMethod : state.cancelMethod,
        keyBindings: newSettings.keyBindings !== undefined ? newSettings.keyBindings : state.keyBindings,
        soundEnabled: newSettings.soundEnabled !== undefined ? newSettings.soundEnabled : state.soundEnabled,
        trackResets: newSettings.trackResets !== undefined ? newSettings.trackResets : state.trackResets,
        trackOvershoots: newSettings.trackOvershoots !== undefined ? newSettings.trackOvershoots : state.trackOvershoots,
        trackRecoveries: newSettings.trackRecoveries !== undefined ? newSettings.trackRecoveries : state.trackRecoveries,
        maxPriceAdjustment: newSettings.maxPriceAdjustment !== undefined ? newSettings.maxPriceAdjustment : state.maxPriceAdjustment
      };

      saveSettingsToStorage({
        mode: updated.mode,
        priceTrainingEnabled: updated.priceTrainingEnabled,
        smartLearningEnabled: updated.smartLearningEnabled,
        examModeEnabled: updated.examModeEnabled,
        focusDrillEnabled: updated.focusDrillEnabled,
        focusDrillEcns: updated.focusDrillEcns,
        sessionLength: updated.sessionLength,
        submissionMethod: updated.submissionMethod,
        cancelMethod: updated.cancelMethod,
        keyBindings: updated.keyBindings,
        soundEnabled: updated.soundEnabled,
        trackResets: updated.trackResets,
        trackOvershoots: updated.trackOvershoots,
        trackRecoveries: updated.trackRecoveries,
        maxPriceAdjustment: updated.maxPriceAdjustment
      });

      return updated;
    });
  },

  toggleFocusDrillEcn: (ecn) => {
    set((state) => {
      const nextFocus = state.focusDrillEcns.includes(ecn)
        ? state.focusDrillEcns.filter((e) => e !== ecn)
        : [...state.focusDrillEcns, ecn];

      get().updateSettings({ focusDrillEcns: nextFocus });
      return { focusDrillEcns: nextFocus };
    });
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
    const ecnWeights = loadWeightsFromStorage();

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
      lastPhysicalKey: '',
      lastKeyVal: '',
      lastShiftHeld: false
    });

    get().nextPrompt();
  },

  pauseSession: () => {
    const { sessionState, startTime } = get();
    if (sessionState !== 'RUNNING' || startTime === null) return;

    set({
      pausedTime: Date.now(),
      accumulatedElapsedMs: get().accumulatedElapsedMs + (Date.now() - startTime),
      sessionState: 'PAUSED'
    });
  },

  resumeSession: () => {
    const { sessionState } = get();
    if (sessionState !== 'PAUSED') return;

    set({
      startTime: Date.now(),
      pausedTime: null,
      sessionState: 'RUNNING'
    });
  },

  endSession: (completed = false) => {
    const { currentSessionEvents, mode, priceTrainingEnabled, smartLearningEnabled, examModeEnabled, sessions, isSessionActive } = get();
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

    const newSession: Session = {
      id: Math.random().toString(36).substring(2, 11),
      date: new Date().toISOString(),
      mode,
      priceTrainingEnabled,
      smartLearningEnabled,
      examModeEnabled,
      accuracy,
      averageTime,
      events: currentSessionEvents,
      fastestTime,
      slowestTime,
      overshootCount,
      resetCount,
      priceAccuracy,
      mistakeMatrix
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
    set({
      currentSessionEvents: [],
      feedback: null,
      sessionState: 'RUNNING',
      accumulatedElapsedMs: 0,
      pausedTime: null
    });
    get().nextPrompt();
  },

  nextPrompt: () => {
    const { sessionLength, currentSessionEvents, ecnWeights, focusDrillEnabled, focusDrillEcns, mode, priceTrainingEnabled } = get();

    // End session automatically if prompt limit is reached
    if (sessionLength > 0 && currentSessionEvents.length >= sessionLength) {
      get().endSession(true);
      return;
    }

    // Determine ECN selection filter
    let ecnFilter: ((ecn: ECN) => boolean) | undefined;
    if (focusDrillEnabled && focusDrillEcns.length > 0) {
      ecnFilter = (ecn) => focusDrillEcns.includes(ecn);
    }

    const nextEcn = selectNextEcn(ecnWeights, ecnFilter);

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
      examModeEnabled,
      soundEnabled,
      currentSessionEvents,
      sessionLength,
      overshootsInCurrentPrompt,
      wrapsInCurrentPrompt,
      recoveriesInCurrentPrompt,
      inputSequence
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

    const ecnCorrect = resolvedEcn === currentPrompt.ecn;
    const priceCorrect = priceTrainingEnabled ? (userPriceAdjustment === currentPrompt.priceAdjustment) : true;
    const correct = ecnCorrect && priceCorrect;

    // Adjust learning weights if smart learning is active
    if (smartLearningEnabled) {
      const nextWeights = adjustEcnWeight(ecnWeights, currentPrompt.ecn, correct);
      set({ ecnWeights: nextWeights });
    }

    // Play oscillators if sound is active
    if (soundEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          if (correct) {
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);
            osc.stop(ctx.currentTime + 0.12);
          } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.22);
            osc.stop(ctx.currentTime + 0.22);
          }
        }
      } catch {
        // Audio blocked
      }
    }

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

    if (examModeEnabled) {
      // Exam mode has no visual pause overlays; snappily proceeds
      set({ currentSessionEvents: nextEvents });
      if (sessionLength > 0 && nextEvents.length >= sessionLength) {
        get().endSession(true);
      } else {
        get().nextPrompt();
      }
    } else {
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
      }, 500);
    }
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
