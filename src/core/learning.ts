import type { ECN, ECNWeightMap, Session, SessionEvent } from '../types';

export const ALL_ECNS: ECN[] = [
  'NSDQ', 'ARCA', 'EDGX', 'EDGA',
  'NYSE', 'NSEX', 'IEX',
  'CHX', 'PHLX',
  'MEMX', 'MIAX', 'AMEX',
  'BATS', 'BATY', 'BOSX'
];

/**
 * Initializes a weight map where every ECN starts with weight 1.0
 */
export function initializeEcnWeights(): ECNWeightMap {
  const weights: ECNWeightMap = {};
  ALL_ECNS.forEach((ecn) => {
    weights[ecn] = 1.0;
  });
  return weights;
}

/**
 * Adjusts an ECN's weight based on performance (dynamic session tracking)
 * Correct: weight -= 0.5 (min 1.0)
 * Incorrect: weight += 2.0
 */
export function adjustEcnWeight(currentWeights: ECNWeightMap, ecn: ECN, correct: boolean): ECNWeightMap {
  const nextWeights = { ...currentWeights };
  const currentVal = nextWeights[ecn] ?? 1.0;
  
  if (correct) {
    nextWeights[ecn] = Math.max(1.0, currentVal - 0.5);
  } else {
    nextWeights[ecn] = currentVal + 2.0;
  }
  
  return nextWeights;
}

/**
 * Computes performance weights across all completed sessions.
 * Low accuracy yields a higher weight (up to 2.5x).
 * Slower ECNs yield a latency boost.
 */
export function computePerformanceWeights(sessions: Session[]): ECNWeightMap {
  const weights: ECNWeightMap = {};
  ALL_ECNS.forEach((ecn) => {
    weights[ecn] = 1.0;
  });

  if (!sessions || sessions.length === 0) {
    return weights;
  }

  // Gather stats per ECN
  const statsMap = new Map<ECN, { correct: number; total: number; totalLatency: number }>();
  ALL_ECNS.forEach((ecn) => {
    statsMap.set(ecn, { correct: 0, total: 0, totalLatency: 0 });
  });

  sessions.forEach((session) => {
    if (!session.events) return;
    session.events.forEach((event) => {
      const ecn = event.expectedEcn;
      const stats = statsMap.get(ecn);
      if (stats) {
        stats.total += 1;
        if (event.correct) {
          stats.correct += 1;
          stats.totalLatency += event.reactionTimeMs;
        }
      }
    });
  });

  // Calculate averages
  let totalLatencyOfAllEcns = 0;
  let ecnsWithLatencyCount = 0;
  const ecnAverages = new Map<ECN, { accuracy: number; avgLatency: number }>();

  ALL_ECNS.forEach((ecn) => {
    const stats = statsMap.get(ecn)!;
    if (stats.total > 0) {
      const accuracy = stats.correct / stats.total;
      const avgLatency = stats.correct > 0 ? stats.totalLatency / stats.correct : 0;
      ecnAverages.set(ecn, { accuracy, avgLatency });
      if (avgLatency > 0) {
        totalLatencyOfAllEcns += avgLatency;
        ecnsWithLatencyCount += 1;
      }
    } else {
      ecnAverages.set(ecn, { accuracy: 1.0, avgLatency: 0 });
    }
  });

  const overallAvgLatency = ecnsWithLatencyCount > 0 ? totalLatencyOfAllEcns / ecnsWithLatencyCount : 0;

  // Set final weights
  ALL_ECNS.forEach((ecn) => {
    const avg = ecnAverages.get(ecn)!;
    const stats = statsMap.get(ecn)!;

    if (stats.total === 0) {
      weights[ecn] = 1.0;
      return;
    }

    const accuracyBoost = 1.0 + (1.0 - avg.accuracy) * 1.5;

    let latencyBoost = 1.0;
    if (avg.avgLatency > 0 && overallAvgLatency > 0 && avg.avgLatency > overallAvgLatency) {
      latencyBoost = 1.0 + Math.min(1.0, (avg.avgLatency - overallAvgLatency) / overallAvgLatency);
    }

    weights[ecn] = accuracyBoost * latencyBoost;
  });

  return weights;
}

/**
 * Performs a hybrid weighted random ECN selection with a session-level coverage guarantee.
 */
export function selectNextEcn(
  weights: ECNWeightMap,
  currentSessionEvents: SessionEvent[],
  repetitionThreshold: number,
  filter?: (ecn: ECN) => boolean
): ECN {
  let eligibleEcns = filter ? ALL_ECNS.filter(filter) : ALL_ECNS;
  if (eligibleEcns.length === 0) {
    eligibleEcns = ALL_ECNS;
  }

  // Count occurrences in current session
  const occurrences = {} as Record<ECN, number>;
  ALL_ECNS.forEach((ecn) => {
    occurrences[ecn] = 0;
  });
  currentSessionEvents.forEach((event) => {
    const ecn = event.expectedEcn;
    if (ecn in occurrences) {
      occurrences[ecn] += 1;
    }
  });

  // Check for unseen ECNs
  const hasUnseenEligible = eligibleEcns.some((ecn) => occurrences[ecn] === 0);

  // Apply coverage guarantee
  let candidates = eligibleEcns;
  if (hasUnseenEligible) {
    const underThreshold = eligibleEcns.filter((ecn) => occurrences[ecn] < repetitionThreshold);
    if (underThreshold.length > 0) {
      candidates = underThreshold;
    }
  }

  const N = currentSessionEvents.length;
  const recentEcnList: ECN[] = [];
  for (let i = Math.max(0, N - 5); i < N; i++) {
    recentEcnList.push(currentSessionEvents[i].expectedEcn);
  }

  let sumOfWeights = 0;
  const candidateWeights = candidates.map((ecn) => {
    const W_perf = weights[ecn] ?? 1.0;

    let P_recency = 1.0;
    const lastIndex = recentEcnList.lastIndexOf(ecn);
    if (lastIndex !== -1) {
      const promptsAgo = recentEcnList.length - lastIndex;
      if (promptsAgo === 1) P_recency = 0.05;
      else if (promptsAgo === 2) P_recency = 0.20;
      else if (promptsAgo === 3) P_recency = 0.40;
      else if (promptsAgo === 4) P_recency = 0.60;
      else if (promptsAgo === 5) P_recency = 0.80;
    }

    let dist = N;
    const lastSessionEventIndex = currentSessionEvents.map(e => e.expectedEcn).lastIndexOf(ecn);
    if (lastSessionEventIndex !== -1) {
      dist = N - 1 - lastSessionEventIndex;
    }
    const B_coverage = 1.0 + (dist / (N + 1)) * 1.5;

    const finalWeight = Math.max(0.1, W_perf * P_recency * B_coverage);
    sumOfWeights += finalWeight;

    return { ecn, finalWeight };
  });

  const rand = Math.random() * sumOfWeights;
  let accumulatedWeight = 0;
  for (const item of candidateWeights) {
    accumulatedWeight += item.finalWeight;
    if (accumulatedWeight >= rand) {
      return item.ecn;
    }
  }

  return candidates[candidates.length - 1];
}

