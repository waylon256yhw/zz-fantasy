/**
 * HP/MP System (Decorative with Micro-fluctuation)
 *
 * Philosophy:
 * - HP/MP are visual decorations, not game mechanics
 * - AI has no awareness of these values
 * - Values fluctuate naturally to create adventure atmosphere
 * - Automatically grows with level
 */

/**
 * Calculate max HP based on level
 * Formula: 100 + level * 20
 * Level 1: 120, Level 10: 300, Level 20: 500
 */
export function calculateMaxHp(level: number): number {
  return 100 + level * 20;
}

/**
 * Calculate max MP based on level
 * Formula: 50 + level * 10
 * Level 1: 60, Level 10: 150, Level 20: 250
 */
export function calculateMaxMp(level: number): number {
  return 50 + level * 10;
}

/**
 * Initialize HP/MP for a new character
 * Returns full HP/MP at character creation
 */
export function initializeHpMp(level: number): {
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
} {
  const maxHp = calculateMaxHp(level);
  const maxMp = calculateMaxMp(level);

  return {
    currentHp: maxHp, // Start at full HP
    maxHp,
    currentMp: maxMp, // Start at full MP
    maxMp,
  };
}

/**
 * Apply micro-fluctuation to current values
 * Returns random value between 70%-100% of max
 * This creates a sense of adventure without requiring AI awareness
 */
export function applyMicroFluctuation(maxValue: number): number {
  const minPercent = 0.7; // 70%
  const maxPercent = 1.0; // 100%
  const randomPercent = minPercent + Math.random() * (maxPercent - minPercent);
  return Math.floor(maxValue * randomPercent);
}

/**
 * Update HP/MP when character levels up
 * Increases max values and restores to 90%-100% (significant reward)
 */
export function updateHpMpOnLevelUp(
  oldLevel: number,
  newLevel: number,
  currentHp: number,
  currentMp: number
): {
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
} {
  const newMaxHp = calculateMaxHp(newLevel);
  const newMaxMp = calculateMaxMp(newLevel);

  // Restore to 90%-100% on level up (significant reward feeling)
  const restorePercent = 0.9 + Math.random() * 0.1; // 90% - 100%
  const newCurrentHp = Math.floor(newMaxHp * restorePercent);
  const newCurrentMp = Math.floor(newMaxMp * restorePercent);

  return {
    currentHp: newCurrentHp,
    maxHp: newMaxHp,
    currentMp: newCurrentMp,
    maxMp: newMaxMp,
  };
}

/**
 * Refresh HP/MP values with micro-fluctuation
 * Call this when loading game or periodically to create atmosphere
 */
export function refreshHpMp(maxHp: number, maxMp: number): {
  currentHp: number;
  currentMp: number;
} {
  return {
    currentHp: applyMicroFluctuation(maxHp),
    currentMp: applyMicroFluctuation(maxMp),
  };
}

/**
 * Ensure HP/MP are within valid ranges
 * Use this when loading old saves that might have invalid data
 */
export function validateHpMp(
  currentHp: number,
  maxHp: number,
  currentMp: number,
  maxMp: number
): {
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
} {
  return {
    currentHp: Math.max(0, Math.min(maxHp, currentHp)),
    maxHp: Math.max(1, maxHp),
    currentMp: Math.max(0, Math.min(maxMp, currentMp)),
    maxMp: Math.max(1, maxMp),
  };
}

/**
 * Apply progressive consumption (adventure fatigue)
 * Each dialogue consumes 0.5%-2% of HP/MP
 * Minimum threshold: 70% (maintains healthy appearance)
 */
export function applyAdventureFatigue(
  currentHp: number,
  maxHp: number,
  currentMp: number,
  maxMp: number
): {
  currentHp: number;
  currentMp: number;
} {
  // Random consumption between 0.5%-2% (slower drain)
  const consumptionPercent = 0.005 + Math.random() * 0.015; // 0.5% - 2%

  // Calculate new values
  const hpLoss = Math.floor(maxHp * consumptionPercent);
  const mpLoss = Math.floor(maxMp * consumptionPercent);

  let newHp = currentHp - hpLoss;
  let newMp = currentMp - mpLoss;

  // Apply minimum threshold (70% of max - healthy state)
  const minHp = Math.floor(maxHp * 0.7);
  const minMp = Math.floor(maxMp * 0.7);

  newHp = Math.max(minHp, newHp);
  newMp = Math.max(minMp, newMp);

  return {
    currentHp: newHp,
    currentMp: newMp,
  };
}
