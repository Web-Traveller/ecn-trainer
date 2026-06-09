import type { Session, ECNWeightMap, KeyBindings, ECN } from '../types';
import { initializeEcnWeights } from './learning';

const SESSIONS_KEY = 'ecn_trainer_sessions';
const WEIGHTS_KEY = 'ecn_trainer_weights';
const SETTINGS_KEY = 'ecn_trainer_settings';

export interface AppSettings {
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
}

const DEFAULT_BINDINGS: KeyBindings = {
  buyGroupA: 'KeyA',
  buyGroupS: 'KeyS',
  buyGroupD: 'KeyD',
  buyGroupZ: 'KeyZ',
  buyGroupX: 'KeyX',

  sellGroupA: 'KeyL',
  sellGroupS: 'Semicolon',
  sellGroupD: 'Quote',
  sellGroupZ: 'Comma',
  sellGroupX: 'Period'
};

const DEFAULT_SETTINGS: AppSettings = {
  mode: 'mixed',
  priceTrainingEnabled: false,
  smartLearningEnabled: true,
  targetEcnModeEnabled: false,
  targetEcns: ['NSDQ'],
  sessionLength: 20,
  submissionMethod: 'Enter',
  cancelMethod: 'Escape',
  keyBindings: DEFAULT_BINDINGS,
  trackResets: true,
  trackOvershoots: true,
  trackRecoveries: true,
  maxPriceAdjustment: 5,
  practiceModeType: 'stable',
  adaptivePacingEnabled: true,
  feedbackDelayMs: 500,
  initialTimeLimitMs: 2000,
  speedDecayMs: 50,
  speedPenaltyMs: 100,
  targetStreakLength: 3
};

export function saveSessionsToStorage(sessions: Session[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
}

export function loadSessionsFromStorage(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch (error) {
    console.error('Failed to parse sessions from localStorage:', error);
    return [];
  }
}

export function saveWeightsToStorage(weights: ECNWeightMap): void {
  try {
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  } catch (error) {
    console.error('Failed to save weights to localStorage:', error);
  }
}

export function loadWeightsFromStorage(): ECNWeightMap {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    if (!raw) return initializeEcnWeights();
    return JSON.parse(raw) as ECNWeightMap;
  } catch (error) {
    console.error('Failed to parse weights from localStorage:', error);
    return initializeEcnWeights();
  }
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Failed to parse settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

export function clearLocalStorageData(): void {
  try {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(WEIGHTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage data:', error);
  }
}
