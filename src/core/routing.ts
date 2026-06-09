import type { ECN, ActionType, InputMetrics, KeyBindings } from '../types';

export const DEFAULT_BINDINGS: KeyBindings = {
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

export const ECN_GROUP_LISTS = {
  GroupA: ['NSDQ', 'ARCA', 'EDGX', 'EDGA'] as ECN[],
  GroupS: ['NYSE', 'NSEX', 'IEX'] as ECN[],
  GroupD: ['CHX', 'PHLX'] as ECN[],
  GroupZ: ['MEMX', 'MIAX', 'AMEX'] as ECN[],
  GroupX: ['BATS', 'BATY', 'BOSX'] as ECN[]
};

/**
 * Identifies which of the 5 group indices an ECN belongs to.
 */
export function getGroupForEcn(ecn: ECN): 'GroupA' | 'GroupS' | 'GroupD' | 'GroupZ' | 'GroupX' | null {
  if (ECN_GROUP_LISTS.GroupA.includes(ecn)) return 'GroupA';
  if (ECN_GROUP_LISTS.GroupS.includes(ecn)) return 'GroupS';
  if (ECN_GROUP_LISTS.GroupD.includes(ecn)) return 'GroupD';
  if (ECN_GROUP_LISTS.GroupZ.includes(ecn)) return 'GroupZ';
  if (ECN_GROUP_LISTS.GroupX.includes(ecn)) return 'GroupX';
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
    if (group === 'GroupA') boundKey = bindings.buyGroupA;
    else if (group === 'GroupS') boundKey = bindings.buyGroupS;
    else if (group === 'GroupD') boundKey = bindings.buyGroupD;
    else if (group === 'GroupZ') boundKey = bindings.buyGroupZ;
    else if (group === 'GroupX') boundKey = bindings.buyGroupX;
  } else {
    if (group === 'GroupA') boundKey = bindings.sellGroupA;
    else if (group === 'GroupS') boundKey = bindings.sellGroupS;
    else if (group === 'GroupD') boundKey = bindings.sellGroupD;
    else if (group === 'GroupZ') boundKey = bindings.sellGroupZ;
    else if (group === 'GroupX') boundKey = bindings.sellGroupX;
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

  let activeGroup: 'GroupA' | 'GroupS' | 'GroupD' | 'GroupZ' | 'GroupX' | null = null;
  if (action === 'BUY') {
    if (activeKeyCode === bindings.buyGroupA) activeGroup = 'GroupA';
    else if (activeKeyCode === bindings.buyGroupS) activeGroup = 'GroupS';
    else if (activeKeyCode === bindings.buyGroupD) activeGroup = 'GroupD';
    else if (activeKeyCode === bindings.buyGroupZ) activeGroup = 'GroupZ';
    else if (activeKeyCode === bindings.buyGroupX) activeGroup = 'GroupX';
  } else {
    if (activeKeyCode === bindings.sellGroupA) activeGroup = 'GroupA';
    else if (activeKeyCode === bindings.sellGroupS) activeGroup = 'GroupS';
    else if (activeKeyCode === bindings.sellGroupD) activeGroup = 'GroupD';
    else if (activeKeyCode === bindings.sellGroupZ) activeGroup = 'GroupZ';
    else if (activeKeyCode === bindings.sellGroupX) activeGroup = 'GroupX';
  }

  // Fallback to check the opposite action's bindings if not found
  if (!activeGroup) {
    if (activeKeyCode === bindings.buyGroupA || activeKeyCode === bindings.sellGroupA) activeGroup = 'GroupA';
    else if (activeKeyCode === bindings.buyGroupS || activeKeyCode === bindings.sellGroupS) activeGroup = 'GroupS';
    else if (activeKeyCode === bindings.buyGroupD || activeKeyCode === bindings.sellGroupD) activeGroup = 'GroupD';
    else if (activeKeyCode === bindings.buyGroupZ || activeKeyCode === bindings.sellGroupZ) activeGroup = 'GroupZ';
    else if (activeKeyCode === bindings.buyGroupX || activeKeyCode === bindings.sellGroupX) activeGroup = 'GroupX';
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
