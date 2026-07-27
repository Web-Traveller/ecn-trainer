import type { ECN, ActionType, InputMetrics, KeyBindings, ECNGroupConfig } from '../types';

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

export const DEFAULT_GROUPS: ECNGroupConfig[] = [
  { id: 'group_a', name: 'Group A', buyKey: 'KeyA', sellKey: 'KeyL', ecns: ['NSDQ', 'ARCA', 'EDGX', 'EDGA'] },
  { id: 'group_s', name: 'Group S', buyKey: 'KeyS', sellKey: 'Semicolon', ecns: ['NYSE', 'NSEX', 'IEX'] },
  { id: 'group_d', name: 'Group D', buyKey: 'KeyD', sellKey: 'Quote', ecns: ['CHX', 'PHLX'] },
  { id: 'group_z', name: 'Group Z', buyKey: 'KeyZ', sellKey: 'Comma', ecns: ['MEMX', 'MIAX', 'AMEX'] },
  { id: 'group_x', name: 'Group X', buyKey: 'KeyX', sellKey: 'Period', ecns: ['BATS', 'BATY', 'BOSX'] }
];

export const ECN_GROUP_LISTS = {
  GroupA: ['NSDQ', 'ARCA', 'EDGX', 'EDGA'] as ECN[],
  GroupS: ['NYSE', 'NSEX', 'IEX'] as ECN[],
  GroupD: ['CHX', 'PHLX'] as ECN[],
  GroupZ: ['MEMX', 'MIAX', 'AMEX'] as ECN[],
  GroupX: ['BATS', 'BATY', 'BOSX'] as ECN[]
};

/**
 * Identifies which ECN group an ECN belongs to from dynamic configuration.
 */
export function getGroupForEcn(ecn: ECN, groups: ECNGroupConfig[] = DEFAULT_GROUPS): ECNGroupConfig | null {
  return groups.find((g) => g.ecns.includes(ecn)) || null;
}

/**
 * Returns the physical key code and the expected number of presses required to target a specific ECN
 */
export function getTargetKeyAndPresses(
  action: ActionType,
  targetEcn: ECN,
  groups: ECNGroupConfig[] = DEFAULT_GROUPS,
  bindings?: KeyBindings
): { key: string; expectedPresses: number } | null {
  const group = getGroupForEcn(targetEcn, groups);
  if (!group) return null;

  let boundKey = action === 'BUY' ? group.buyKey : group.sellKey;

  // Fallback override if legacy bindings provided and matching default groups
  if (bindings) {
    if (group.id === 'group_a') boundKey = action === 'BUY' ? bindings.buyGroupA : bindings.sellGroupA;
    else if (group.id === 'group_s') boundKey = action === 'BUY' ? bindings.buyGroupS : bindings.sellGroupS;
    else if (group.id === 'group_d') boundKey = action === 'BUY' ? bindings.buyGroupD : bindings.sellGroupD;
    else if (group.id === 'group_z') boundKey = action === 'BUY' ? bindings.buyGroupZ : bindings.sellGroupZ;
    else if (group.id === 'group_x') boundKey = action === 'BUY' ? bindings.buyGroupX : bindings.sellGroupX;
  }

  const index = group.ecns.indexOf(targetEcn);
  if (index === -1) return null;

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
  groups: ECNGroupConfig[] = DEFAULT_GROUPS,
  bindings?: KeyBindings
): { currentEcn: ECN | null; metrics: InputMetrics } {
  const targetInfo = getTargetKeyAndPresses(action, targetEcn, groups, bindings);

  let activeGroup = groups.find((g) => (action === 'BUY' ? g.buyKey === activeKeyCode : g.sellKey === activeKeyCode));

  // Fallback check opposite action or bindings
  if (!activeGroup) {
    activeGroup = groups.find((g) => g.buyKey === activeKeyCode || g.sellKey === activeKeyCode);
  }

  if (!activeGroup || activeGroup.ecns.length === 0 || pressCount <= 0) {
    return {
      currentEcn: null,
      metrics: { overshoots: 0, wraps: 0, recoveries: 0, spaceResets }
    };
  }

  const groupEcns = activeGroup.ecns;
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
