import type { ECN, ActionType, InputMetrics, KeyBindings } from '../types';

export const DEFAULT_BINDINGS: KeyBindings = {
  buyGroup1: 'KeyA',
  buyGroup2: 'KeyZ',
  buyGroup3: 'KeyQ',

  sellGroup1: 'KeyD',
  sellGroup2: 'KeyC',
  sellGroup3: 'KeyE'
};

export const ECN_GROUP_LISTS = {
  Group1: ['NSDQ', 'ARCA', 'EDGX', 'EDGA', 'IEX'] as ECN[],
  Group2: ['MEMX', 'MIAX', 'AMEX', 'CHSX', 'NSEX', 'PHLX'] as ECN[],
  Group3: ['BATS', 'BATY', 'BOSX', 'NYSE'] as ECN[]
};

/**
 * Identifies which of the 3 group indices an ECN belongs to.
 */
export function getGroupForEcn(ecn: ECN): 'Group1' | 'Group2' | 'Group3' | null {
  if (ECN_GROUP_LISTS.Group1.includes(ecn)) return 'Group1';
  if (ECN_GROUP_LISTS.Group2.includes(ecn)) return 'Group2';
  if (ECN_GROUP_LISTS.Group3.includes(ecn)) return 'Group3';
  return null;
}

/**
 * Returns the physical key code and the expected number of presses required to target a specific ECN
 */
export function getTargetKeyAndPresses(
  action: ActionType,
  targetEcn: ECN,
  bindings: KeyBindings
): { key: string; expectedPresses: number } | null {
  const group = getGroupForEcn(targetEcn);
  if (!group) return null;

  let boundKey = '';
  if (action === 'BUY') {
    if (group === 'Group1') boundKey = bindings.buyGroup1;
    else if (group === 'Group2') boundKey = bindings.buyGroup2;
    else if (group === 'Group3') boundKey = bindings.buyGroup3;
  } else {
    if (group === 'Group1') boundKey = bindings.sellGroup1;
    else if (group === 'Group2') boundKey = bindings.sellGroup2;
    else if (group === 'Group3') boundKey = bindings.sellGroup3;
  }

  const ecns = ECN_GROUP_LISTS[group];
  const index = ecns.indexOf(targetEcn);
  return { key: boundKey, expectedPresses: index + 1 };
}

/**
 * Processes inputs and calculates the resolved ECN and key stroke metrics based on dynamic configurations
 */
export function processInput(
  action: ActionType,
  targetEcn: ECN,
  activeKeyCode: string, // physical event.code
  pressCount: number,
  spaceResets: number,
  bindings: KeyBindings
): { currentEcn: ECN | null; metrics: InputMetrics } {
  const targetInfo = getTargetKeyAndPresses(action, targetEcn, bindings);

  let activeGroup: 'Group1' | 'Group2' | 'Group3' | null = null;
  if (action === 'BUY') {
    if (activeKeyCode === bindings.buyGroup1) activeGroup = 'Group1';
    else if (activeKeyCode === bindings.buyGroup2) activeGroup = 'Group2';
    else if (activeKeyCode === bindings.buyGroup3) activeGroup = 'Group3';
  } else {
    if (activeKeyCode === bindings.sellGroup1) activeGroup = 'Group1';
    else if (activeKeyCode === bindings.sellGroup2) activeGroup = 'Group2';
    else if (activeKeyCode === bindings.sellGroup3) activeGroup = 'Group3';
  }

  // Fallback to check the opposite action's bindings if not found
  if (!activeGroup) {
    if (activeKeyCode === bindings.buyGroup1 || activeKeyCode === bindings.sellGroup1) activeGroup = 'Group1';
    else if (activeKeyCode === bindings.buyGroup2 || activeKeyCode === bindings.sellGroup2) activeGroup = 'Group2';
    else if (activeKeyCode === bindings.buyGroup3 || activeKeyCode === bindings.sellGroup3) activeGroup = 'Group3';
  }

  if (!activeGroup || pressCount <= 0) {
    return {
      currentEcn: null,
      metrics: { overshoots: 0, wraps: 0, recoveries: 0, spaceResets }
    };
  }

  const groupEcns = ECN_GROUP_LISTS[activeGroup];
  const currentIndex = (pressCount - 1) % groupEcns.length;
  const currentEcn = groupEcns[currentIndex];

  let overshoots = 0;
  let recoveries = 0;
  const wraps = Math.floor((pressCount - 1) / groupEcns.length);

  if (targetInfo && targetInfo.key === activeKeyCode) {
    const expected = targetInfo.expectedPresses;
    if (pressCount > expected) {
      overshoots = pressCount - expected;
    }
    if (pressCount > expected && (pressCount - expected) % groupEcns.length === 0) {
      recoveries = Math.floor((pressCount - expected) / groupEcns.length);
    }
  } else {
    overshoots = pressCount;
  }

  return {
    currentEcn,
    metrics: { overshoots, wraps, recoveries, spaceResets }
  };
}
