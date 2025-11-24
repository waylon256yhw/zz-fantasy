/**
 * Combat System Configuration
 * All constants for combat mechanics
 */

export const COMBAT_CONFIG = {
  // ===== AP (Action Points) System =====
  BASE_MAX_AP: 100, // Base maximum AP at level 1
  AP_PER_LEVEL: 5, // AP increase per level
  AP_COST_ATTACK: 20, // AP cost for attacking
  AP_COST_DEFEND: 10, // AP cost for defending
  AP_COST_ENCOUNTER: 30, // AP cost to start an encounter
  AP_RECOVERY_PER_DIALOGUE: 8, // AP recovered per non-combat dialogue

  // ===== Potion Effects =====
  HEALING_POTION_AP_PERCENT: 0.3, // 每回合恢复上限 30% AP（向下取整）
  HEALING_POTION_TURNS: 5, // 持续 5 回合（含使用当回合）

  // ===== Turn System =====
  MAX_TURNS: 10, // Maximum turns for normal enemies
  TREASURE_MAX_TURNS: 3, // Maximum turns for treasure monsters (they escape quickly)

  // ===== Attack Power Calculation =====
  // Weights for calculating attack power from stats
  ATTACK_WEIGHTS: {
    STR: 2.0, // Strength has highest impact on physical damage
    DEX: 1.5, // Dexterity affects accuracy and some damage
    INT: 1.0, // Intelligence for magic damage
    CHA: 0.5, // Charisma has minimal combat effect
    LUCK: 1.2, // Luck affects critical chance
  },
  ATTACK_LEVEL_MULTIPLIER: 2, // Attack power increase per level

  // ===== Enemy Attack System =====
  STRONG_ATTACK_PROBABILITY: 0.3, // 30% chance for enemy to use strong attack
  STRONG_ATTACK_MULTIPLIER: 2, // Strong attack deals 2x AP damage
  DEFEND_AP_REDUCTION: 0.5, // Defense reduces AP damage by 50%

  // ===== Retreat System =====
  RETREAT_AP_COST: 20, // AP penalty if retreat succeeds

  // ===== Enemy Generation =====
  TREASURE_MONSTER_PROBABILITY: 0.1, // 10% chance to encounter treasure monster

  // ===== Damage Variance =====
  DAMAGE_VARIANCE: 0.1, // ±10% random damage variance

  // ===== Difficulty Curve (Enemy HP Scaling) =====
  DIFFICULTY_CURVE: {
    // Level thresholds for different game phases
    EARLY_GAME_LEVEL: 3, // Levels 1-3
    MID_GAME_LEVEL: 7, // Levels 4-7
    LATE_GAME_LEVEL: 12, // Levels 8-12

    // HP growth rate per level in each phase
    EARLY_GROWTH: 0.15, // 15% per level (Lv1-3)
    MID_GROWTH: 0.20, // 20% per level (Lv4-7)
    MID_LATE_GROWTH: 0.25, // 25% per level (Lv8-12)
    LATE_GROWTH: 0.30, // 30% per level (Lv13+)

    // Rank-based HP multipliers
    RANK_MULTIPLIERS: {
      D: 1.0, // D-rank: baseline
      C: 1.15, // C-rank: +15% HP
      B: 1.3, // B-rank: +30% HP
      A: 1.5, // A-rank: +50% HP
    } as const,
  },
} as const;

// Type helper for config
export type CombatConfig = typeof COMBAT_CONFIG;
