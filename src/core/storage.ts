import { invoke } from '@tauri-apps/api/core';
import type { Session, ECNWeightMap, KeyBindings, ECN, ECNRoutingConfig } from '../types';
import { initializeEcnWeights } from './learning';
import { DEFAULT_GROUPS } from './routing';

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
  routingConfig: ECNRoutingConfig;
  priceRangeMode: 'preset' | 'custom';
  minPriceAdjustment: number;
  maxPriceAdjustment: number;
  trackResets: boolean;
  trackOvershoots: boolean;
  trackRecoveries: boolean;
  practiceModeType: 'stable' | 'time_limit';
  adaptivePacingEnabled: boolean;
  feedbackDelayMs: number;
  initialTimeLimitMs: number;
  speedDecayMs: number;
  speedPenaltyMs: number;
  targetStreakLength: number;
  flashModeEnabled: boolean;
  flashDurationMs: number;
  celebrationEffect: 'confetti' | 'money_rain';
  experimentalFeaturesEnabled: boolean;
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
  routingConfig: { groups: DEFAULT_GROUPS },
  priceRangeMode: 'preset',
  minPriceAdjustment: 1,
  maxPriceAdjustment: 5,
  trackResets: true,
  trackOvershoots: true,
  trackRecoveries: true,
  practiceModeType: 'stable',
  adaptivePacingEnabled: true,
  feedbackDelayMs: 500,
  initialTimeLimitMs: 2000,
  speedDecayMs: 50,
  speedPenaltyMs: 100,
  targetStreakLength: 3,
  flashModeEnabled: false,
  flashDurationMs: 300,
  celebrationEffect: 'money_rain',
  experimentalFeaturesEnabled: false
};

export async function saveSessionsToStorage(sessions: Session[]): Promise<void> {
  try {
    const jsonStr = JSON.stringify(sessions);
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      await invoke('save_sessions_to_file', { jsonData: jsonStr });
    } else {
      localStorage.setItem(SESSIONS_KEY, jsonStr);
    }
  } catch (error) {
    console.error('Failed to save sessions to storage:', error);
  }
}

export async function loadSessionsFromStorage(): Promise<Session[]> {
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const fileData = await invoke<string>('load_sessions_from_file');
      const fileSessions = JSON.parse(fileData) as Session[];

      // Migration check: if localStorage has legacy sessions on this origin, merge them
      const rawLocal = localStorage.getItem(SESSIONS_KEY);
      if (rawLocal) {
        const localSessions = JSON.parse(rawLocal) as Session[];
        if (localSessions.length > 0) {
          console.log('[STORAGE] Legacy sessions found in localStorage. Merging to local file...');
          const fileSessionIds = new Set(fileSessions.map(s => s.id));
          const mergedSessions = [...fileSessions];

          localSessions.forEach((s) => {
            if (!fileSessionIds.has(s.id)) {
              mergedSessions.push(s);
            }
          });

          // Sort chronological descending (newest first)
          mergedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          await invoke('save_sessions_to_file', { jsonData: JSON.stringify(mergedSessions) });
          try {
            localStorage.removeItem(SESSIONS_KEY);
          } catch (err) {
            console.error('[STORAGE] Failed to clear legacy key:', err);
          }
          return mergedSessions;
        }
      }
      return fileSessions;
    } else {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Session[];
    }
  } catch (error) {
    console.error('Failed to load sessions from storage:', error);
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

export function loadWeightsFromStorage(groups = DEFAULT_GROUPS): ECNWeightMap {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    if (!raw) return initializeEcnWeights(groups);
    const parsed = JSON.parse(raw) as ECNWeightMap;
    // ensure new ECNs get default weights if missing
    const defaultWeights = initializeEcnWeights(groups);
    return { ...defaultWeights, ...parsed };
  } catch (error) {
    console.error('Failed to parse weights from localStorage:', error);
    return initializeEcnWeights(groups);
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
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      routingConfig: parsed.routingConfig || { groups: DEFAULT_GROUPS },
      priceRangeMode: parsed.priceRangeMode || 'preset',
      minPriceAdjustment: parsed.minPriceAdjustment ?? 1
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
