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
