import type { Session, ECNWeightMap, KeyBindings, ECN } from '../types';
import { initializeEcnWeights } from './learning';

const SESSIONS_KEY = 'ecn_trainer_sessions';
const WEIGHTS_KEY = 'ecn_trainer_weights';
const SETTINGS_KEY = 'ecn_trainer_settings';
const SETTINGS_VERSION = 2; // Bumped when keybinding schema changes

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
  buyGroup1: 'KeyA',
  buyGroup2: 'KeyZ',
  buyGroup3: 'KeyQ',

  sellGroup1: 'KeyD',
  sellGroup2: 'KeyC',
  sellGroup3: 'KeyE'
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, _version: SETTINGS_VERSION }));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);

    // Version check: if stored version doesn't match, wipe keybindings
    if (parsed._version !== SETTINGS_VERSION) {
      console.info('[ECN Trainer] Settings schema version mismatch — resetting keybindings to defaults.');
      const migrated = { ...DEFAULT_SETTINGS, ...parsed, keyBindings: DEFAULT_BINDINGS, _version: SETTINGS_VERSION };
      saveSettingsToStorage(migrated);
      return migrated;
    }

    // Safely merge keyBindings to prevent old/missing keys from causing issues
    const parsedBindings = parsed.keyBindings || {};
    const keyBindings: KeyBindings = {
      buyGroup1: parsedBindings.buyGroup1 || DEFAULT_SETTINGS.keyBindings.buyGroup1,
      buyGroup2: parsedBindings.buyGroup2 || DEFAULT_SETTINGS.keyBindings.buyGroup2,
      buyGroup3: parsedBindings.buyGroup3 || DEFAULT_SETTINGS.keyBindings.buyGroup3,
      sellGroup1: parsedBindings.sellGroup1 || DEFAULT_SETTINGS.keyBindings.sellGroup1,
      sellGroup2: parsedBindings.sellGroup2 || DEFAULT_SETTINGS.keyBindings.sellGroup2,
      sellGroup3: parsedBindings.sellGroup3 || DEFAULT_SETTINGS.keyBindings.sellGroup3,
    };

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      keyBindings
    };
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
