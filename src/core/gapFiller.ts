import type { Session, SessionEvent, ECN } from '../types';
import { saveSessionsToStorage } from './storage';

export interface PracticeGap {
  id: string;
  start: number; // Timestamp ms
  end: number;   // Timestamp ms
  durationMs: number;
  prevSessionId: string;
  nextSessionId: string;
  prevSessionDate: string;
  nextSessionDate: string;
}

const getLocalDateString = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Finds all gaps longer than 2 minutes between today's chronological sessions.
 */
export function findTodayGaps(sessions: Session[]): PracticeGap[] {
  if (!sessions || sessions.length < 2) return [];

  const todayStr = getLocalDateString(new Date());

  // Filter today's sessions and sort chronologically (oldest first)
  const todaySessions = sessions
    .filter((s) => getLocalDateString(new Date(s.date)) === todayStr)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (todaySessions.length < 2) return [];

  const gaps: PracticeGap[] = [];

  for (let i = 0; i < todaySessions.length - 1; i++) {
    const sessionA = todaySessions[i];
    const sessionB = todaySessions[i + 1];

    const endA = new Date(sessionA.date).getTime();
    const durationB = sessionB.sessionDurationMs || (sessionB.averageTime * sessionB.events.length) || 0;
    const startB = new Date(sessionB.date).getTime() - durationB;

    const gapMs = startB - endA;

    // Only count gaps larger than 2 minutes (120,000 ms)
    if (gapMs > 120000) {
      gaps.push({
        id: `${sessionA.id}_to_${sessionB.id}`,
        start: endA,
        end: startB,
        durationMs: gapMs,
        prevSessionId: sessionA.id,
        nextSessionId: sessionB.id,
        prevSessionDate: sessionA.date,
        nextSessionDate: sessionB.date
      });
    }
  }

  return gaps;
}

function generateScrambledEvents(
  templateEvents: SessionEvent[],
  count: number,
  sessionStartTime: number,
  sessionDurationMs: number
): SessionEvent[] {
  const events: SessionEvent[] = [];
  const eventInterval = sessionDurationMs / Math.max(1, count);

  const correctEvents = templateEvents.filter((e) => e.correct);
  const baselineAccuracy = templateEvents.length > 0
    ? correctEvents.length / templateEvents.length
    : 0.90;

  const avgReactionTimeMs = templateEvents.length > 0
    ? templateEvents.reduce((sum, e) => sum + e.reactionTimeMs, 0) / templateEvents.length
    : 800;

  for (let i = 0; i < count; i++) {
    const templateEvent = templateEvents.length > 0
      ? templateEvents[Math.floor(Math.random() * templateEvents.length)]
      : null;

    const promptTimestamp = Math.floor(sessionStartTime + (i * eventInterval) + (Math.random() * (eventInterval * 0.4)));
    const reactionTimeMs = Math.floor(avgReactionTimeMs * (0.9 + Math.random() * 0.2));
    const isCorrect = Math.random() < (baselineAccuracy + (Math.random() * 0.04 - 0.02));

    const expectedEcn = templateEvent?.expectedEcn || ('NSDQ' as ECN);
    const actualEcn = isCorrect ? expectedEcn : (templateEvent?.actualEcn || 'None' as ECN);

    const event: SessionEvent = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: promptTimestamp,
      prompt: {
        action: templateEvent?.prompt.action || (Math.random() < 0.5 ? 'BUY' : 'SELL'),
        ecn: expectedEcn,
        basePrice: templateEvent?.prompt.basePrice,
        priceAdjustment: templateEvent?.prompt.priceAdjustment
      },
      expectedEcn,
      actualEcn,
      action: templateEvent?.action || (Math.random() < 0.5 ? 'BUY' : 'SELL'),
      reactionTimeMs,
      usedSpaceReset: templateEvent?.usedSpaceReset || false,
      keySequence: templateEvent?.keySequence || ['KeyA'],
      correct: isCorrect,
      priceCorrect: templateEvent?.priceCorrect !== undefined ? isCorrect : undefined,
      expectedPriceAdjustment: templateEvent?.expectedPriceAdjustment,
      actualPriceAdjustment: templateEvent?.priceCorrect !== undefined
        ? (isCorrect ? templateEvent.expectedPriceAdjustment : undefined)
        : undefined,
      metrics: {
        overshoots: templateEvent?.metrics.overshoots || 0,
        wraps: templateEvent?.metrics.wraps || 0,
        recoveries: templateEvent?.metrics.recoveries || 0,
        spaceResets: templateEvent?.metrics.spaceResets || 0
      }
    };

    events.push(event);
  }

  return events;
}

export const SESSION_PROFILES = [
  { prompts: 200, durationMs: 16 * 60000 }, // 16 minutes
  { prompts: 150, durationMs: 12 * 60000 }, // 12 minutes
  { prompts: 100, durationMs: 8 * 60000 },  // 8 minutes
  { prompts: 50, durationMs: 4 * 60000 },   // 4 minutes
  { prompts: 25, durationMs: 2 * 60000 }    // 2 minutes
];

/**
 * Calculates optimal fill plan matching target duration accurately.
 */
export function calculateOptimalFillPlan(targetMs: number): { prompts: number; durationMs: number }[] {
  let remaining = targetMs;
  const plan: { prompts: number; durationMs: number }[] = [];

  for (const profile of SESSION_PROFILES) {
    while (remaining >= profile.durationMs) {
      plan.push(profile);
      remaining -= profile.durationMs;
    }
  }

  // If targetMs is smaller than 2 mins or remaining remainder exists
  if (plan.length === 0 && targetMs > 0) {
    const minutes = Math.max(1, Math.round(targetMs / 60000));
    plan.push({ prompts: Math.round(minutes * 12.5), durationMs: targetMs });
  }

  return plan;
}

export function injectMultiSessionsIntoGap(
  gap: PracticeGap,
  targetMs: number,
  sessions: Session[]
): Session[] {
  const prevSession = sessions.find((s) => s.id === gap.prevSessionId);
  const nextSession = sessions.find((s) => s.id === gap.nextSessionId);
  const template = prevSession || nextSession || sessions[0];

  if (!template) return sessions;

  const actualFillMs = Math.min(targetMs, gap.durationMs);
  const plan = calculateOptimalFillPlan(actualFillMs);
  const K = plan.length;
  if (K === 0) return sessions;

  const totalSessionDuration = plan.reduce((sum, item) => sum + item.durationMs, 0);
  const totalBreakTime = Math.max(0, gap.durationMs - totalSessionDuration);
  const breakInterval = totalBreakTime / (K + 1);

  let newMockSessions: Session[] = [];
  let currentTime = gap.start;

  for (let i = 0; i < K; i++) {
    const item = plan[i];
    currentTime += breakInterval;

    const sessionStartTime = currentTime;
    const sessionEndTime = sessionStartTime + item.durationMs;

    const mockEvents = generateScrambledEvents(
      template.events,
      item.prompts,
      sessionStartTime,
      item.durationMs
    );

    const correctEvents = mockEvents.filter((e) => e.correct);
    const accuracy = (correctEvents.length / mockEvents.length) * 100;
    const averageTime = mockEvents.reduce((sum, e) => sum + e.reactionTimeMs, 0) / mockEvents.length;

    const reactionTimes = mockEvents.map((e) => e.reactionTimeMs);
    const fastestTime = Math.min(...reactionTimes);
    const slowestTime = Math.max(...reactionTimes);
    const overshootCount = mockEvents.reduce((sum, e) => sum + e.metrics.overshoots, 0);
    const resetCount = mockEvents.reduce((sum, e) => sum + e.metrics.spaceResets, 0);

    const mistakeCounts: Record<string, { expected: ECN; actual: string; count: number }> = {};
    mockEvents.forEach((e) => {
      if (!e.correct) {
        const actualVal = e.actualEcn || 'None';
        const key = `${e.expectedEcn} -> ${actualVal}`;
        if (!mistakeCounts[key]) {
          mistakeCounts[key] = { expected: e.expectedEcn, actual: actualVal, count: 0 };
        }
        mistakeCounts[key].count += 1;
      }
    });

    const mockSession: Session = {
      id: `mock_${Math.random().toString(36).substring(2, 9)}`,
      date: new Date(sessionEndTime).toISOString(),
      mode: template.mode,
      priceTrainingEnabled: template.priceTrainingEnabled,
      smartLearningEnabled: template.smartLearningEnabled,
      accuracy,
      averageTime,
      events: mockEvents,
      fastestTime,
      slowestTime,
      overshootCount,
      resetCount,
      priceAccuracy: template.priceTrainingEnabled ? accuracy : undefined,
      mistakeMatrix: Object.values(mistakeCounts).sort((a, b) => b.count - a.count),
      targetEcnModeEnabled: template.targetEcnModeEnabled,
      targetEcn: template.targetEcn,
      targetEcns: template.targetEcns,
      practiceModeType: template.practiceModeType,
      initialTimeLimitMs: template.initialTimeLimitMs,
      speedDecayMs: template.speedDecayMs,
      speedPenaltyMs: template.speedPenaltyMs,
      targetStreakLength: template.targetStreakLength,
      repetitionThreshold: template.repetitionThreshold,
      sessionDurationMs: item.durationMs
    };

    newMockSessions.push(mockSession);
    currentTime = sessionEndTime;
  }

  const updatedSessions = [...newMockSessions, ...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  saveSessionsToStorage(updatedSessions);
  return updatedSessions;
}
