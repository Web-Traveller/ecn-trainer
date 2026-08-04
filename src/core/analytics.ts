import type { Session, ECN } from '../types';

export interface ECNMetrics {
  ecn: ECN;
  accuracy: number;
  averageTimeMs: number;
  attempts: number;
  resets: number;
  overshoots: number;
}

export interface MistakeDetail {
  expected: ECN;
  actual: ECN;
  count: number;
}

export interface SwitchStats {
  avgTimeMs: number;
  count: number;
}

export interface CumulativeStats {
  overallAccuracy: number;
  averageReactionTimeMs: number;
  fastestTimeMs: number;
  slowestTimeMs: number;
  spaceResets: number;
  overshoots: number;
  wraps: number;
  recoveries: number;
  totalPrompts: number;
  ecnMetrics: Record<string, ECNMetrics>;
  commonMistakes: MistakeDetail[]; // Complete mistake matrix
  switchAnalysis: {
    buyBuy: SwitchStats;
    buySell: SwitchStats;
    sellBuy: SwitchStats;
    sellSell: SwitchStats;
  };
}

/**
 * Calculates aggregate stats for a list of sessions
 */
export function calculateCumulativeStats(sessions: Session[]): CumulativeStats {
  const allEvents = sessions.flatMap((s) => s.events);
  const totalPrompts = allEvents.length;

  const defaultSwitchStats = { avgTimeMs: 0, count: 0 };
  const initialStats: CumulativeStats = {
    overallAccuracy: 0,
    averageReactionTimeMs: 0,
    fastestTimeMs: 0,
    slowestTimeMs: 0,
    spaceResets: 0,
    overshoots: 0,
    wraps: 0,
    recoveries: 0,
    totalPrompts: 0,
    ecnMetrics: {},
    commonMistakes: [],
    switchAnalysis: {
      buyBuy: { ...defaultSwitchStats },
      buySell: { ...defaultSwitchStats },
      sellBuy: { ...defaultSwitchStats },
      sellSell: { ...defaultSwitchStats }
    }
  };

  if (totalPrompts === 0) {
    return initialStats;
  }

  const correctEvents = allEvents.filter((e) => e.correct);
  const overallAccuracy = (correctEvents.length / totalPrompts) * 100;

  // Reaction Times
  const reactionTimes = allEvents.map((e) => e.reactionTimeMs);
  const averageReactionTimeMs = reactionTimes.reduce((a, b) => a + b, 0) / totalPrompts;
  
  const fastestTimeMs = Math.min(...reactionTimes);
  const slowestTimeMs = Math.max(...reactionTimes);

  // Totals from metrics
  let totalSpaceResets = 0;
  let totalOvershoots = 0;
  let totalWraps = 0;
  let totalRecoveries = 0;

  allEvents.forEach((e) => {
    totalSpaceResets += e.metrics.spaceResets;
    totalOvershoots += e.metrics.overshoots;
    totalWraps += e.metrics.wraps;
    totalRecoveries += e.metrics.recoveries;
  });

  // Per-ECN Stats Accumulator
  const ecnGroups: Record<string, { totalTime: number; correctCount: number; attempts: number; resets: number; overshoots: number }> = {};
  
  // Mistake tracker: "EXPECTED -> ACTUAL" => count
  const mistakeCounts: Record<string, { expected: ECN; actual: ECN; count: number }> = {};

  allEvents.forEach((e) => {
    const ecn = e.expectedEcn;
    if (!ecnGroups[ecn]) {
      ecnGroups[ecn] = { totalTime: 0, correctCount: 0, attempts: 0, resets: 0, overshoots: 0 };
    }
    
    ecnGroups[ecn].attempts += 1;
    ecnGroups[ecn].totalTime += e.reactionTimeMs;
    ecnGroups[ecn].resets += e.metrics.spaceResets;
    ecnGroups[ecn].overshoots += e.metrics.overshoots;

    if (e.correct) {
      ecnGroups[ecn].correctCount += 1;
    } else {
      const actualVal = e.actualEcn || 'None';
      const key = `${e.expectedEcn} -> ${actualVal}`;
      if (!mistakeCounts[key]) {
        mistakeCounts[key] = { expected: e.expectedEcn, actual: actualVal, count: 0 };
      }
      mistakeCounts[key].count += 1;
    }
  });

  // Calculate ECN metrics
  const ecnMetrics: Record<string, ECNMetrics> = {};
  Object.keys(ecnGroups).forEach((ecnKey) => {
    const data = ecnGroups[ecnKey];
    ecnMetrics[ecnKey] = {
      ecn: ecnKey as ECN,
      accuracy: (data.correctCount / data.attempts) * 100,
      averageTimeMs: data.totalTime / data.attempts,
      attempts: data.attempts,
      resets: data.resets,
      overshoots: data.overshoots
    };
  });

  // Sort mistake matrix by frequency descending
  const commonMistakes = Object.values(mistakeCounts)
    .sort((a, b) => b.count - a.count);

  // Buy/Sell Switch Analysis
  let bbTime = 0, bbCount = 0;
  let bsTime = 0, bsCount = 0;
  let sbTime = 0, sbCount = 0;
  let ssTime = 0, ssCount = 0;

  sessions.forEach((s) => {
    const events = s.events;
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      if (prev.action === 'BUY' && curr.action === 'BUY') {
        bbTime += curr.reactionTimeMs;
        bbCount += 1;
      } else if (prev.action === 'BUY' && curr.action === 'SELL') {
        bsTime += curr.reactionTimeMs;
        bsCount += 1;
      } else if (prev.action === 'SELL' && curr.action === 'BUY') {
        sbTime += curr.reactionTimeMs;
        sbCount += 1;
      } else if (prev.action === 'SELL' && curr.action === 'SELL') {
        ssTime += curr.reactionTimeMs;
        ssCount += 1;
      }
    }
  });

  return {
    overallAccuracy,
    averageReactionTimeMs,
    fastestTimeMs,
    slowestTimeMs,
    spaceResets: totalSpaceResets,
    overshoots: totalOvershoots,
    wraps: totalWraps,
    recoveries: totalRecoveries,
    totalPrompts,
    ecnMetrics,
    commonMistakes,
    switchAnalysis: {
      buyBuy: { avgTimeMs: bbCount > 0 ? bbTime / bbCount : 0, count: bbCount },
      buySell: { avgTimeMs: bsCount > 0 ? bsTime / bsCount : 0, count: bsCount },
      sellBuy: { avgTimeMs: sbCount > 0 ? sbTime / sbCount : 0, count: sbCount },
      sellSell: { avgTimeMs: ssCount > 0 ? ssTime / ssCount : 0, count: ssCount }
    }
  };
}

export interface GlobalStats {
  totalSessions: number;
  totalPrompts: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  overallAverageSpeedSeconds: number;
  totalTrainingTimeMs: number;
  averageSessionDurationMs: number;
  averagePromptsPerSession: number;
  sessionHistory: { id: string; date: string; accuracy: number; speedSeconds: number }[];
  bestSession: Session | null;
  worstSession: Session | null;
  fastestSession: Session | null;
  slowestSession: Session | null;
  longestSession: Session | null;
  shortestSession: Session | null;
  mostPracticedEcn: { ecn: ECN; count: number } | null;
  leastPracticedEcn: { ecn: ECN; count: number } | null;
  highestAccuracyEcn: { ecn: ECN; accuracy: number } | null;
  lowestAccuracyEcn: { ecn: ECN; accuracy: number } | null;
  fastestEcn: { ecn: ECN; speedSeconds: number } | null;
  slowestEcn: { ecn: ECN; speedSeconds: number } | null;
  longestStreak: number;
  accuracyTrend: 'up' | 'down' | 'flat';
  speedTrend: 'up' | 'down' | 'flat';
  accuracyTrendValue: number;
  speedTrendValue: number;
  improvementAccuracy: number;
  improvementSpeed: number;
  improvementAccuracy10: number;
  improvementSpeed10: number;
  mostEffectiveMode: string;
  bestPerformingPromptCount: number;
  bestPriceModeAccuracy: number;
  bestTargetEcnModeAccuracy: number;
}

export function calculateGlobalStats(sessions: Session[]): GlobalStats {
  const defaultHistory: { id: string; date: string; accuracy: number; speedSeconds: number }[] = [];
  const initialGlobalStats: GlobalStats = {
    totalSessions: 0,
    totalPrompts: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    overallAccuracy: 0,
    overallAverageSpeedSeconds: 0,
    totalTrainingTimeMs: 0,
    averageSessionDurationMs: 0,
    averagePromptsPerSession: 0,
    sessionHistory: defaultHistory,
    bestSession: null,
    worstSession: null,
    fastestSession: null,
    slowestSession: null,
    longestSession: null,
    shortestSession: null,
    mostPracticedEcn: null,
    leastPracticedEcn: null,
    highestAccuracyEcn: null,
    lowestAccuracyEcn: null,
    fastestEcn: null,
    slowestEcn: null,
    longestStreak: 0,
    accuracyTrend: 'flat',
    speedTrend: 'flat',
    accuracyTrendValue: 0,
    speedTrendValue: 0,
    improvementAccuracy: 0,
    improvementSpeed: 0,
    improvementAccuracy10: 0,
    improvementSpeed10: 0,
    mostEffectiveMode: 'N/A',
    bestPerformingPromptCount: 0,
    bestPriceModeAccuracy: 0,
    bestTargetEcnModeAccuracy: 0
  };

  if (!sessions || sessions.length === 0) {
    return initialGlobalStats;
  }

  // Sort sessions chronologically (oldest first) to track trends and history
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const allEvents = sortedSessions.flatMap((s) => s.events);
  const totalSessions = sortedSessions.length;
  const totalPrompts = allEvents.length;

  if (totalPrompts === 0) {
    return {
      ...initialGlobalStats,
      totalSessions
    };
  }

  const totalCorrect = allEvents.filter((e) => e.correct).length;
  const totalIncorrect = totalPrompts - totalCorrect;
  const overallAccuracy = (totalCorrect / totalPrompts) * 100;
  
  const reactionTimes = allEvents.map((e) => e.reactionTimeMs);
  const overallAverageSpeedSeconds = (reactionTimes.reduce((a, b) => a + b, 0) / totalPrompts) / 1000;

  // Duration tracking
  const totalTrainingTimeMs = sortedSessions.reduce((acc, s) => {
    return acc + (s.sessionDurationMs || (s.averageTime * s.events.length) || 0);
  }, 0);
  const averageSessionDurationMs = totalTrainingTimeMs / totalSessions;
  const averagePromptsPerSession = totalPrompts / totalSessions;

  // History mapping (chronological)
  const sessionHistory = sortedSessions.map((s) => ({
    id: s.id,
    date: s.date,
    accuracy: s.accuracy,
    speedSeconds: s.averageTime / 1000
  }));

  // Extreme Sessions
  let bestSession = sessions[0];
  let worstSession = sessions[0];
  let fastestSession = sessions[0];
  let slowestSession = sessions[0];
  let longestSession = sessions[0];
  let shortestSession = sessions[0];
  sessions.forEach((s) => {
    const currentDuration = s.sessionDurationMs || (s.averageTime * s.events.length) || 0;

    if (s.accuracy > bestSession.accuracy || (s.accuracy === bestSession.accuracy && s.averageTime < bestSession.averageTime)) {
      bestSession = s;
    }
    if (s.accuracy < worstSession.accuracy || (s.accuracy === worstSession.accuracy && s.averageTime > worstSession.averageTime)) {
      worstSession = s;
    }
    if (s.averageTime < fastestSession.averageTime) {
      fastestSession = s;
    }
    if (s.averageTime > slowestSession.averageTime) {
      slowestSession = s;
    }
    if (currentDuration > (longestSession.sessionDurationMs || (longestSession.averageTime * longestSession.events.length) || 0)) {
      longestSession = s;
    }
    if (currentDuration < (shortestSession.sessionDurationMs || (shortestSession.averageTime * shortestSession.events.length) || 0)) {
      shortestSession = s;
    }
  });

  // ECN-level calculations
  const ecnTotals: Record<string, { totalTimeMs: number; correctCount: number; attempts: number }> = {};
  allEvents.forEach((e) => {
    const ecn = e.expectedEcn;
    if (!ecnTotals[ecn]) {
      ecnTotals[ecn] = { totalTimeMs: 0, correctCount: 0, attempts: 0 };
    }
    ecnTotals[ecn].attempts += 1;
    ecnTotals[ecn].totalTimeMs += e.reactionTimeMs;
    if (e.correct) {
      ecnTotals[ecn].correctCount += 1;
    }
  });

  const ecnStatsList = Object.entries(ecnTotals).map(([ecnKey, data]) => ({
    ecn: ecnKey as ECN,
    attempts: data.attempts,
    accuracy: (data.correctCount / data.attempts) * 100,
    speedSeconds: (data.totalTimeMs / data.attempts) / 1000
  }));

  let mostPracticedEcn: { ecn: ECN; count: number } | null = null;
  let leastPracticedEcn: { ecn: ECN; count: number } | null = null;
  let highestAccuracyEcn: { ecn: ECN; accuracy: number } | null = null;
  let lowestAccuracyEcn: { ecn: ECN; accuracy: number } | null = null;
  let fastestEcn: { ecn: ECN; speedSeconds: number } | null = null;
  let slowestEcn: { ecn: ECN; speedSeconds: number } | null = null;

  if (ecnStatsList.length > 0) {
    const sortedPractice = [...ecnStatsList].sort((a, b) => b.attempts - a.attempts);
    mostPracticedEcn = { ecn: sortedPractice[0].ecn, count: sortedPractice[0].attempts };
    leastPracticedEcn = { ecn: sortedPractice[sortedPractice.length - 1].ecn, count: sortedPractice[sortedPractice.length - 1].attempts };

    const sortedAcc = [...ecnStatsList].sort((a, b) => b.accuracy - a.accuracy);
    highestAccuracyEcn = { ecn: sortedAcc[0].ecn, accuracy: sortedAcc[0].accuracy };
    lowestAccuracyEcn = { ecn: sortedAcc[sortedAcc.length - 1].ecn, accuracy: sortedAcc[sortedAcc.length - 1].accuracy };

    const sortedSpeed = [...ecnStatsList].sort((a, b) => a.speedSeconds - b.speedSeconds);
    fastestEcn = { ecn: sortedSpeed[0].ecn, speedSeconds: sortedSpeed[0].speedSeconds };
    slowestEcn = { ecn: sortedSpeed[sortedSpeed.length - 1].ecn, speedSeconds: sortedSpeed[sortedSpeed.length - 1].speedSeconds };
  }

  // Longest correct streak across all events chronologically
  let longestStreak = 0;
  let currentStreak = 0;
  allEvents.forEach((e) => {
    if (e.correct) {
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  });

  // Trends (compare last 5 sessions to all-time averages)
  const lastSessions = [...sortedSessions].reverse().slice(0, 5);
  const lastSessionsAccuracyAvg = lastSessions.reduce((acc, s) => acc + s.accuracy, 0) / lastSessions.length;
  const lastSessionsSpeedAvg = lastSessions.reduce((acc, s) => acc + s.averageTime, 0) / lastSessions.length / 1000;

  const accuracyTrendValue = lastSessionsAccuracyAvg - overallAccuracy;
  const speedTrendValue = lastSessionsSpeedAvg - overallAverageSpeedSeconds; // lower is better for speed

  const accuracyTrend = accuracyTrendValue > 1 ? 'up' : accuracyTrendValue < -1 ? 'down' : 'flat';
  const speedTrend = speedTrendValue < -0.05 ? 'up' : speedTrendValue > 0.05 ? 'down' : 'flat'; // up = speeding up, down = slowing down

  // Improvement (First vs Last Session)
  const firstSession = sortedSessions[0];
  const lastSession = sortedSessions[sortedSessions.length - 1];
  const improvementAccuracy = lastSession.accuracy - firstSession.accuracy;
  const improvementSpeed = (firstSession.averageTime - lastSession.averageTime) / 1000; // positive means speed got faster (reaction time decreased)

  // Improvement Over Last 10 Sessions (Last 5 vs previous 5)
  let improvementAccuracy10 = 0;
  let improvementSpeed10 = 0;
  if (sortedSessions.length >= 10) {
    const reversed = [...sortedSessions].reverse();
    const groupA = reversed.slice(0, 5);
    const groupB = reversed.slice(5, 10);
    const avgAccA = groupA.reduce((acc, s) => acc + s.accuracy, 0) / 5;
    const avgAccB = groupB.reduce((acc, s) => acc + s.accuracy, 0) / 5;
    const avgSpeedA = groupA.reduce((acc, s) => acc + s.averageTime, 0) / 5 / 1000;
    const avgSpeedB = groupB.reduce((acc, s) => acc + s.averageTime, 0) / 5 / 1000;

    improvementAccuracy10 = avgAccA - avgAccB;
    improvementSpeed10 = avgSpeedB - avgSpeedA; // positive is improvement
  }

  // Training configurations effectiveness
  const modeGroups: Record<string, { totalCorrect: number; totalAttempts: number }> = {};
  sessions.forEach((s) => {
    if (!modeGroups[s.mode]) {
      modeGroups[s.mode] = { totalCorrect: 0, totalAttempts: 0 };
    }
    const correct = s.events.filter((e) => e.correct).length;
    modeGroups[s.mode].totalAttempts += s.events.length;
    modeGroups[s.mode].totalCorrect += correct;
  });
  let mostEffectiveMode = 'N/A';
  let bestModeAcc = 0;
  Object.entries(modeGroups).forEach(([m, d]) => {
    const acc = (d.totalCorrect / d.totalAttempts) * 100;
    if (acc > bestModeAcc) {
      bestModeAcc = acc;
      mostEffectiveMode = m;
    }
  });

  const promptCountGroups: Record<number, { totalCorrect: number; totalAttempts: number }> = {};
  sessions.forEach((s) => {
    const len = s.events.length; // prompt count
    if (!promptCountGroups[len]) {
      promptCountGroups[len] = { totalCorrect: 0, totalAttempts: 0 };
    }
    const correct = s.events.filter((e) => e.correct).length;
    promptCountGroups[len].totalAttempts += len;
    promptCountGroups[len].totalCorrect += correct;
  });
  let bestPerformingPromptCount = 0;
  let bestPromptAcc = 0;
  Object.entries(promptCountGroups).forEach(([lenStr, d]) => {
    const acc = (d.totalCorrect / d.totalAttempts) * 100;
    if (acc > bestPromptAcc) {
      bestPromptAcc = acc;
      bestPerformingPromptCount = Number(lenStr);
    }
  });

  const priceModeSessions = sessions.filter((s) => s.priceTrainingEnabled);
  const bestPriceModeAccuracy = priceModeSessions.length > 0
    ? priceModeSessions.reduce((acc, s) => acc + s.accuracy, 0) / priceModeSessions.length
    : 0;

  const targetEcnModeSessions = sessions.filter((s) => s.targetEcnModeEnabled);
  const bestTargetEcnModeAccuracy = targetEcnModeSessions.length > 0
    ? targetEcnModeSessions.reduce((acc, s) => acc + s.accuracy, 0) / targetEcnModeSessions.length
    : 0;

  return {
    totalSessions,
    totalPrompts,
    totalCorrect,
    totalIncorrect,
    overallAccuracy,
    overallAverageSpeedSeconds,
    totalTrainingTimeMs,
    averageSessionDurationMs,
    averagePromptsPerSession,
    sessionHistory,
    bestSession,
    worstSession,
    fastestSession,
    slowestSession,
    longestSession,
    shortestSession,
    mostPracticedEcn,
    leastPracticedEcn,
    highestAccuracyEcn,
    lowestAccuracyEcn,
    fastestEcn,
    slowestEcn,
    longestStreak,
    accuracyTrend,
    speedTrend,
    accuracyTrendValue,
    speedTrendValue,
    improvementAccuracy,
    improvementSpeed,
    improvementAccuracy10,
    improvementSpeed10,
    mostEffectiveMode,
    bestPerformingPromptCount,
    bestPriceModeAccuracy,
    bestTargetEcnModeAccuracy
  };
}

export interface DailyPracticeSummary {
  dateStr: string; // YYYY-MM-DD
  minutes: number;
  sessionCount: number;
  promptCount: number;
  correctCount: number;
  totalTimeMs: number;
  accuracy: number;        // overall accuracy for that day (0-100)
  avgSpeedSeconds: number; // average speed for that day (seconds)
}

export interface PracticeHabitStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  weeklyConsistencyPercent: number; // % of days active in current week (last 7 days)
  dailyMap: Record<string, DailyPracticeSummary>; // key is YYYY-MM-DD
  heatmapData: { dateStr: string; count: number; minutes: number; prompts: number }[]; // for the calendar heatmap (last 365 days)
  last14DaysData: { dateStr: string; label: string; minutes: number }[]; // for the 14-day bar chart
}

const getLocalDateString = (dateObj: Date): string => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function calculatePracticeHabitStats(sessions: Session[]): PracticeHabitStats {
  const dailyMap: Record<string, DailyPracticeSummary> = {};

  // 1. Group by local date string
  sessions.forEach((s) => {
    const d = new Date(s.date);
    const dateStr = getLocalDateString(d);
    
    // Duration in minutes
    const durationMs = s.sessionDurationMs || (s.averageTime * s.events.length) || 0;
    const durationMin = durationMs / (1000 * 60);
    const promptCount = s.events.length;
    const correctCount = s.events.filter(e => e.correct).length;
    const totalTimeMs = s.events.reduce((sum, e) => sum + e.reactionTimeMs, 0);

    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = {
        dateStr,
        minutes: 0,
        sessionCount: 0,
        promptCount: 0,
        correctCount: 0,
        totalTimeMs: 0,
        accuracy: 0,
        avgSpeedSeconds: 0
      };
    }
    dailyMap[dateStr].minutes += durationMin;
    dailyMap[dateStr].sessionCount += 1;
    dailyMap[dateStr].promptCount += promptCount;
    dailyMap[dateStr].correctCount += correctCount;
    dailyMap[dateStr].totalTimeMs += totalTimeMs;
  });

  // Calculate averages for dailyMap
  Object.keys(dailyMap).forEach((dateStr) => {
    const day = dailyMap[dateStr];
    if (day.promptCount > 0) {
      day.accuracy = (day.correctCount / day.promptCount) * 100;
      day.avgSpeedSeconds = (day.totalTimeMs / day.promptCount) / 1000;
    }
  });

  // 2. Streaks calculation
  const activeDates = Object.keys(dailyMap).sort();
  let longestStreak = 0;
  let currentStreak = 0;

  if (activeDates.length > 0) {
    // Helper to add/subtract days
    const addDays = (dateStr: string, days: number): string => {
      const d = new Date(dateStr + 'T00:00:00'); // append time to parse local date
      d.setDate(d.getDate() + days);
      return getLocalDateString(d);
    };

    // Calculate longest streak
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < activeDates.length; i++) {
      const prevDate = activeDates[i - 1];
      const currDate = activeDates[i];
      const expectedNext = addDays(prevDate, 1);
      if (currDate === expectedNext) {
        tempStreak += 1;
      } else if (currDate !== prevDate) {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Calculate current streak
    const todayStr = getLocalDateString(new Date());
    const yesterdayStr = addDays(todayStr, -1);

    let checkDateStr = '';
    if (dailyMap[todayStr]) {
      checkDateStr = todayStr;
    } else if (dailyMap[yesterdayStr]) {
      checkDateStr = yesterdayStr;
    }

    if (checkDateStr) {
      currentStreak = 0;
      let curr = checkDateStr;
      while (dailyMap[curr]) {
        currentStreak += 1;
        curr = addDays(curr, -1);
      }
    }
  }

  // 3. Weekly consistency (active days in last 7 days including today)
  let activeInLast7 = 0;
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = getLocalDateString(d);
    if (dailyMap[dStr]) {
      activeInLast7 += 1;
    }
  }
  const weeklyConsistencyPercent = (activeInLast7 / 7) * 100;

  // 4. Last 14 days chart data
  const last14DaysData: { dateStr: string; label: string; minutes: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = getLocalDateString(d);
    const label = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    last14DaysData.push({
      dateStr: dStr,
      label,
      minutes: dailyMap[dStr]?.minutes || 0
    });
  }

  // 5. Heatmap data (for the calendar: exactly 53 weeks * 7 days = 371 days, aligned Sunday to Saturday)
  const heatmapData: { dateStr: string; count: number; minutes: number; prompts: number }[] = [];
  
  const endDate = new Date(today);
  const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  endDate.setDate(today.getDate() + (6 - dayOfWeek)); // align to current Saturday

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 370); // go back 53 weeks (370 days back from Saturday is a Sunday)

  for (let i = 0; i < 371; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dStr = getLocalDateString(d);
    heatmapData.push({
      dateStr: dStr,
      count: dailyMap[dStr]?.sessionCount || 0,
      minutes: dailyMap[dStr]?.minutes || 0,
      prompts: dailyMap[dStr]?.promptCount || 0
    });
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: activeDates.length,
    weeklyConsistencyPercent,
    dailyMap,
    heatmapData,
    last14DaysData
  };
}

