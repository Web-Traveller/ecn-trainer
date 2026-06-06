import type { ECN, ECNWeightMap } from '../types';

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
 * Adjusts an ECN's weight based on performance
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
 * Performs a weighted random selection from the list of available ECNs
 */
export function selectNextEcn(weights: ECNWeightMap, filter?: (ecn: ECN) => boolean): ECN {
  const eligibleEcns = filter ? ALL_ECNS.filter(filter) : ALL_ECNS;
  
  if (eligibleEcns.length === 0) {
    // Fallback if filter empties the array
    return ALL_ECNS[Math.floor(Math.random() * ALL_ECNS.length)];
  }

  // Calculate cumulative sum of weights
  let sum = 0;
  const itemWeights = eligibleEcns.map((ecn) => {
    const w = weights[ecn] ?? 1.0;
    sum += w;
    return { ecn, accumulatedWeight: sum };
  });

  const rand = Math.random() * sum;
  
  // Find the first ECN whose accumulated weight exceeds the random value
  for (const item of itemWeights) {
    if (item.accumulatedWeight >= rand) {
      return item.ecn;
    }
  }

  return eligibleEcns[eligibleEcns.length - 1];
}
