/**
 * Combat System - Numerical Calculations
 * Handles all combat-related calculations (attack power, AP, damage, etc.)
 */

import { Character, CharacterStats, Item } from '../../types';
import { COMBAT_CONFIG } from '../config/combatConfig';

/**
 * Calculate total stats including equipment bonuses
 * (In Phase 1, statsBonus is reserved but not calculated)
 */
export function getTotalStats(character: Character): CharacterStats {
  return {
    STR: character.stats.STR + (character.statsBonus?.STR || 0),
    DEX: character.stats.DEX + (character.statsBonus?.DEX || 0),
    INT: character.stats.INT + (character.statsBonus?.INT || 0),
    CHA: character.stats.CHA + (character.statsBonus?.CHA || 0),
    LUCK: character.stats.LUCK + (character.statsBonus?.LUCK || 0),
  };
}

/**
 * Aggregate stat bonuses from inventory items
 * - 装备与拥有的特殊物品可以通过 statBonus 提升（或削弱）五维
 * - 所有带有 statBonus 的物品效果会叠加
 */
export function computeStatsBonusFromInventory(inventory: Item[] | undefined | null): CharacterStats {
  const zero: CharacterStats = { STR: 0, DEX: 0, INT: 0, CHA: 0, LUCK: 0 };
  if (!Array.isArray(inventory)) return zero;

  return inventory.reduce<CharacterStats>((acc, item) => {
    const bonus = item.statBonus;
    if (!bonus) return acc;

    return {
      STR: acc.STR + (bonus.STR ?? 0),
      DEX: acc.DEX + (bonus.DEX ?? 0),
      INT: acc.INT + (bonus.INT ?? 0),
      CHA: acc.CHA + (bonus.CHA ?? 0),
      LUCK: acc.LUCK + (bonus.LUCK ?? 0),
    };
  }, zero);
}

/**
 * Calculate attack power based on stats and level
 * Formula: Weighted sum of stats + level bonus
 */
export function calculateAttackPower(character: Character): number {
  const stats = getTotalStats(character);
  const { ATTACK_WEIGHTS, ATTACK_LEVEL_MULTIPLIER } = COMBAT_CONFIG;

  const weightedSum =
    stats.STR * ATTACK_WEIGHTS.STR +
    stats.DEX * ATTACK_WEIGHTS.DEX +
    stats.INT * ATTACK_WEIGHTS.INT +
    stats.CHA * ATTACK_WEIGHTS.CHA +
    stats.LUCK * ATTACK_WEIGHTS.LUCK;

  const levelBonus = character.level * ATTACK_LEVEL_MULTIPLIER;

  return Math.floor(weightedSum + levelBonus);
}

/**
 * Calculate maximum AP based on level
 * Formula: BASE_MAX_AP + (level - 1) * AP_PER_LEVEL
 */
export function calculateMaxAP(level: number): number {
  return COMBAT_CONFIG.BASE_MAX_AP + (level - 1) * COMBAT_CONFIG.AP_PER_LEVEL;
}

/**
 * Recover AP after dialogue (non-combat)
 */
export function recoverAP(currentAP: number, maxAP: number): number {
  const newAP = currentAP + COMBAT_CONFIG.AP_RECOVERY_PER_DIALOGUE;
  return Math.min(newAP, maxAP);
}

/**
 * Recover AP from consuming food
 * 新规则：百分比 + 固定值，根据价格段分档：
 * - 低档（<=35G）： 5% maxAP + 5
 * - 中低档（<=50G）：10% maxAP + 8
 * - 中高档（<=65G）：15% maxAP + 10
 * - 高档（>65G）：20% maxAP + 12
 * 最终值会向下取整，并 clamp 在 [1, maxAP-currentAP] 之内
 */
export function recoverAPFromFood(currentAP: number, maxAP: number, foodPrice: number): number {
  let percent = 0.05;
  let flat = 5;

  if (foodPrice <= 35) {
    percent = 0.05;
    flat = 5;
  } else if (foodPrice <= 50) {
    percent = 0.1;
    flat = 8;
  } else if (foodPrice <= 65) {
    percent = 0.15;
    flat = 10;
  } else {
    percent = 0.2;
    flat = 12;
  }

  const fromPercent = Math.floor(maxAP * percent);
  let apRecovery = fromPercent + flat;

  if (apRecovery < 1) apRecovery = 1;

  const newAP = currentAP + apRecovery;
  return Math.min(newAP, maxAP);
}

/**
 * Check if player has enough AP to perform action
 */
export function canPerformAction(
  currentAP: number,
  action: 'attack' | 'defend' | 'encounter'
): boolean {
  // 行动规则调整：
  // - 只要当前AP > 0，就允许本回合进行一次战斗动作（攻击 / 防御）
  // - 遭遇战（encounter）仍然需要达到基础消耗门槛，避免在 1 点 AP 时强行开战
  if (currentAP <= 0) return false;

  const costs = {
    attack: COMBAT_CONFIG.AP_COST_ATTACK,
    defend: COMBAT_CONFIG.AP_COST_DEFEND,
    encounter: COMBAT_CONFIG.AP_COST_ENCOUNTER,
  };
  if (action === 'encounter') {
    return currentAP >= costs.encounter;
  }

  return true;
}

/**
 * Consume AP for action
 */
export function consumeAP(currentAP: number, action: 'attack' | 'defend' | 'encounter'): number {
  const costs = {
    attack: COMBAT_CONFIG.AP_COST_ATTACK,
    defend: COMBAT_CONFIG.AP_COST_DEFEND,
    encounter: COMBAT_CONFIG.AP_COST_ENCOUNTER,
  };
  return Math.max(0, currentAP - costs[action]);
}

/**
 * Calculate damage dealt to enemy
 * Formula: max(1, attackPower - enemyDefense) with ±10% variance
 */
export function calculateDamageToEnemy(attackPower: number, enemyDefense: number): number {
  const baseDamage = Math.max(1, attackPower - enemyDefense);

  // Apply random variance (±10%)
  const variance = 1 + (Math.random() * 2 - 1) * COMBAT_CONFIG.DAMAGE_VARIANCE;
  const finalDamage = Math.floor(baseDamage * variance);

  return Math.max(1, finalDamage);
}

/**
 * Calculate AP damage from enemy attack
 * If player is defending, damage is reduced by 50%
 */
export function calculateAPDamage(
  enemyAttack: number,
  isStrongAttack: boolean,
  isPlayerDefending: boolean
): number {
  let damage = enemyAttack;

  if (isStrongAttack) {
    damage = Math.floor(damage * COMBAT_CONFIG.STRONG_ATTACK_MULTIPLIER);
  }

  if (isPlayerDefending) {
    damage = Math.floor(damage * COMBAT_CONFIG.DEFEND_AP_REDUCTION);
  }

  return Math.max(1, damage);
}

/**
 * Calculate retreat success chance based on DEX and LUCK
 * Formula: (DEX + LUCK) / 200 (max 100%)
 */
export function calculateRetreatChance(character: Character): number {
  const stats = getTotalStats(character);
  const chance = (stats.DEX + stats.LUCK) / 200;
  return Math.min(1, Math.max(0, chance)); // Clamp between 0 and 1
}

/**
 * Determine if enemy will use strong attack next turn
 */
export function willEnemyUseStrongAttack(): boolean {
  return Math.random() < COMBAT_CONFIG.STRONG_ATTACK_PROBABILITY;
}

/**
 * Check if combat has exceeded maximum turn limit
 * Returns true when current turn exceeds max turns (e.g., turn 11 when maxTurns=10)
 */
export function checkTimeout(currentTurn: number, maxTurns: number): boolean {
  return currentTurn > maxTurns;
}
