export type ActionType = 'BUY' | 'SELL';

export type ECN =
  | 'NSDQ' | 'ARCA' | 'EDGX' | 'EDGA' | 'IEX'   // Group 1
  | 'MEMX' | 'MIAX' | 'AMEX' | 'CHSX' | 'NSEX' | 'PHLX' // Group 2
  | 'BATS' | 'BATY' | 'BOSX' | 'NYSE';           // Group 3

export interface Prompt {
  action: ActionType;
  ecn: ECN;
  basePrice?: number;         // e.g. 91.07
  priceAdjustment?: number;   // In cents (e.g. +3, -2). undefined if price mode is off
}

export interface InputMetrics {
  overshoots: number;
  wraps: number;
  recoveries: number;
  spaceResets: number;
}

export interface SessionEvent {
  id: string;
  timestamp: number;
  prompt: Prompt;
  expectedEcn: ECN;
  actualEcn: ECN;
  action: ActionType;
  reactionTimeMs: number;
  usedSpaceReset: boolean;
  keySequence: string[];      // Array of physical event.code inputs (e.g. ['KeyA', 'KeyA'])
  correct: boolean;
  priceCorrect?: boolean;
  expectedPriceAdjustment?: number;
  actualPriceAdjustment?: number;
  metrics: InputMetrics;
}

export interface Session {
  id: string;
  date: string;               // ISO Date String
  mode: 'buy_only' | 'sell_only' | 'mixed';
  priceTrainingEnabled: boolean;
  smartLearningEnabled: boolean;
  accuracy: number;           // Final overall percentage (0-100)
  averageTime: number;        // In milliseconds
  events: SessionEvent[];
  
  // Session-specific analytics
  fastestTime?: number;
  slowestTime?: number;
  overshootCount?: number;
  resetCount?: number;
  priceAccuracy?: number;
  mistakeMatrix?: { expected: ECN; actual: string; count: number }[];

  // Session-specific configuration details
  targetEcnModeEnabled?: boolean;
  targetEcn?: ECN | null;
  targetEcns?: ECN[];
  practiceModeType?: 'stable' | 'time_limit';
  initialTimeLimitMs?: number;
  speedDecayMs?: number;
  speedPenaltyMs?: number;
  targetStreakLength?: number;
  repetitionThreshold?: number;
  sessionDurationMs?: number; // Total active time taken to complete session
}

export interface ECNWeightMap {
  [ecn: string]: number;      // Current adaptive weight of ECN (starts at 1.0)
}

export interface KeyBindings {
  buyGroup1: string;          // Default: 'KeyA'
  buyGroup2: string;          // Default: 'KeyZ'
  buyGroup3: string;          // Default: 'KeyQ'

  sellGroup1: string;         // Default: 'KeyD'
  sellGroup2: string;         // Default: 'KeyC'
  sellGroup3: string;         // Default: 'KeyE'
}
