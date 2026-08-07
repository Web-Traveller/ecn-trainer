import type { Session, SessionEvent, ECN, ActionType } from '../types';
import { saveSessionsToStorage } from './storage';

export interface CustomInjectionParams {
  date: string; // ISO String or YYYY-MM-DD
  promptCount: number;
  accuracy: number; // 0 - 100
  avgSpeedMs: number;
  mode: 'buy_only' | 'sell_only' | 'mixed';
  interPromptPauseMs?: number; // Optional pause between prompts in ms (default: 1200ms)
}

const COMMON_ECNS: ECN[] = ['NSDQ', 'ARCA', 'EDGX', 'EDGA', 'BATS', 'AMEX', 'NYSE', 'IEX', 'MEMX', 'PHLX'];

/**
 * Calculates exact mathematical session duration in milliseconds
 * based on prompt count, reaction speed, and pause between prompts.
 */
export function calculateSessionDuration(
  promptCount: number,
  avgSpeedMs: number,
  interPromptPauseMs: number = 1200
): number {
  const safeCount = Math.max(1, promptCount);
  const safeSpeed = Math.max(100, avgSpeedMs);
  return safeCount * (safeSpeed + interPromptPauseMs);
}

export function generateCustomSession(params: CustomInjectionParams): Session {
  const { date, promptCount, accuracy, avgSpeedMs, mode, interPromptPauseMs = 1200 } = params;

  const cycleTimeMs = Math.max(100, avgSpeedMs) + interPromptPauseMs;
  const sessionDurationMs = calculateSessionDuration(promptCount, avgSpeedMs, interPromptPauseMs);
  
  const sessionEndTime = new Date(date).getTime();
  const sessionStartTime = sessionEndTime - sessionDurationMs;

  const targetCorrectCount = Math.round((accuracy / 100) * promptCount);

  // Randomly distribute which prompt indices are correct vs incorrect
  const correctIndices = new Set<number>();
  while (correctIndices.size < targetCorrectCount && correctIndices.size < promptCount) {
    const idx = Math.floor(Math.random() * promptCount);
    correctIndices.add(idx);
  }

  const events: SessionEvent[] = [];
  let currentTimestamp = sessionStartTime;

  for (let i = 0; i < promptCount; i++) {
    const isCorrect = correctIndices.has(i);
    const expectedEcn = COMMON_ECNS[Math.floor(Math.random() * COMMON_ECNS.length)];
    const actualEcn = isCorrect ? expectedEcn : COMMON_ECNS[(COMMON_ECNS.indexOf(expectedEcn) + 1) % COMMON_ECNS.length];

    let action: ActionType;
    if (mode === 'buy_only') action = 'BUY';
    else if (mode === 'sell_only') action = 'SELL';
    else action = Math.random() < 0.5 ? 'BUY' : 'SELL';

    // Speed variation ±15% around average speed
    const reactionTimeMs = Math.max(200, Math.floor(avgSpeedMs * (0.85 + Math.random() * 0.3)));
    
    // Increment timestamp by exact prompt cycle time
    currentTimestamp += cycleTimeMs;

    const event: SessionEvent = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: currentTimestamp,
      prompt: {
        action,
        ecn: expectedEcn
      },
      expectedEcn,
      actualEcn,
      action,
      reactionTimeMs,
      usedSpaceReset: false,
      keySequence: action === 'BUY' ? ['KeyA'] : ['KeyL'],
      correct: isCorrect,
      metrics: {
        overshoots: 0,
        wraps: 0,
        recoveries: 0,
        spaceResets: 0
      }
    };

    events.push(event);
  }

  const reactionTimes = events.map((e) => e.reactionTimeMs);
  const fastestTime = Math.min(...reactionTimes);
  const slowestTime = Math.max(...reactionTimes);
  const averageTime = reactionTimes.reduce((a, b) => a + b, 0) / events.length;

  const mistakeCounts: Record<string, { expected: ECN; actual: string; count: number }> = {};
  events.forEach((e) => {
    if (!e.correct) {
      const key = `${e.expectedEcn} -> ${e.actualEcn}`;
      if (!mistakeCounts[key]) {
        mistakeCounts[key] = { expected: e.expectedEcn, actual: e.actualEcn, count: 0 };
      }
      mistakeCounts[key].count += 1;
    }
  });

  return {
    id: `injected_${Math.random().toString(36).substring(2, 9)}`,
    date: new Date(sessionEndTime).toISOString(),
    mode,
    priceTrainingEnabled: false,
    smartLearningEnabled: true,
    accuracy,
    averageTime,
    events,
    fastestTime,
    slowestTime,
    overshootCount: 0,
    resetCount: 0,
    mistakeMatrix: Object.values(mistakeCounts),
    targetEcnModeEnabled: false,
    practiceModeType: 'stable',
    initialTimeLimitMs: 2000,
    speedDecayMs: 50,
    speedPenaltyMs: 100,
    targetStreakLength: 3,
    repetitionThreshold: 3,
    sessionDurationMs
  };
}

export async function injectCustomSessionIntoStorage(
  params: CustomInjectionParams,
  existingSessions: Session[]
): Promise<Session[]> {
  const newSession = generateCustomSession(params);
  const updatedSessions = [newSession, ...existingSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  await saveSessionsToStorage(updatedSessions);
  return updatedSessions;
}
