/**
 * Enemy System - Enemy Generation and Templates
 * Handles enemy creation based on player level and location
 */

import { Enemy } from '../../types';
import { COMBAT_CONFIG } from '../config/combatConfig';

// Enemy template structure
interface EnemyTemplate {
  name: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
}

// Treasure monster template (special type)
interface TreasureTemplate extends EnemyTemplate {
  goldReward: number;
  maxTurns: number;
}

/**
 * Enemy templates by rank
 * baseHp/baseAttack/baseDefense are scaled by level
 */
const ENEMY_TEMPLATES: Record<'D' | 'C' | 'B' | 'A', EnemyTemplate[]> = {
  D: [
    { name: '野生史莱姆', baseHp: 60, baseAttack: 5, baseDefense: 2 },
    { name: '流浪哥布林', baseHp: 70, baseAttack: 6, baseDefense: 3 },
    { name: '腐朽骷髅', baseHp: 55, baseAttack: 7, baseDefense: 1 },
    { name: '暗影蝙蝠', baseHp: 60, baseAttack: 6, baseDefense: 2 },
  ],
  C: [
    { name: '变异史莱姆', baseHp: 110, baseAttack: 10, baseDefense: 5 },
    { name: '哥布林战士', baseHp: 130, baseAttack: 12, baseDefense: 7 },
    { name: '暗影刺客', baseHp: 100, baseAttack: 15, baseDefense: 4 },
    { name: '森林狼人', baseHp: 120, baseAttack: 13, baseDefense: 6 },
  ],
  B: [
    { name: '岩石巨魔', baseHp: 200, baseAttack: 18, baseDefense: 12 },
    { name: '荒野狼王', baseHp: 180, baseAttack: 22, baseDefense: 10 },
    { name: '炎魔', baseHp: 160, baseAttack: 25, baseDefense: 8 },
    { name: '冰霜元素', baseHp: 170, baseAttack: 20, baseDefense: 11 },
  ],
  A: [
    { name: '遗迹守护者', baseHp: 300, baseAttack: 30, baseDefense: 20 },
    { name: '暗黑骑士', baseHp: 280, baseAttack: 35, baseDefense: 22 },
    { name: '古龙幼崽', baseHp: 350, baseAttack: 40, baseDefense: 18 },
    { name: '虚空行者', baseHp: 320, baseAttack: 38, baseDefense: 19 },
  ],
};

/**
 * Treasure monster templates
 * Low stats, short turns, high gold rewards
 */
const TREASURE_MONSTERS: TreasureTemplate[] = [
  {
    name: '黄金史莱姆',
    baseHp: 30,
    baseAttack: 1,
    baseDefense: 1,
    goldReward: 500,
    maxTurns: 3,
  },
  {
    name: '宝箱怪',
    baseHp: 50,
    baseAttack: 2,
    baseDefense: 2,
    goldReward: 800,
    maxTurns: 3,
  },
  {
    name: '财运猫妖',
    baseHp: 40,
    baseAttack: 1,
    baseDefense: 1,
    goldReward: 650,
    maxTurns: 3,
  },
];

/**
 * Generate enemy based on rank and player level
 */
function generateEnemyFromTemplate(
  template: EnemyTemplate,
  rank: 'D' | 'C' | 'B' | 'A',
  playerLevel: number,
  isTreasure: boolean = false
): Enemy {
  // Level follows player with ±2 variance
  const levelVariance = Math.floor(Math.random() * 5) - 2; // -2 to +2
  const enemyLevel = Math.max(1, playerLevel + levelVariance);

  // Calculate HP with phase-based scaling
  const { DIFFICULTY_CURVE } = COMBAT_CONFIG;
  let hpMultiplier: number;

  if (enemyLevel <= DIFFICULTY_CURVE.EARLY_GAME_LEVEL) {
    // Early game (Lv1-3): 15% per level
    hpMultiplier = 1 + (enemyLevel - 1) * DIFFICULTY_CURVE.EARLY_GROWTH;
  } else if (enemyLevel <= DIFFICULTY_CURVE.MID_GAME_LEVEL) {
    // Mid game (Lv4-7): Base 1.3x, then 20% per level
    hpMultiplier = 1.3 + (enemyLevel - DIFFICULTY_CURVE.EARLY_GAME_LEVEL) * DIFFICULTY_CURVE.MID_GROWTH;
  } else if (enemyLevel <= DIFFICULTY_CURVE.LATE_GAME_LEVEL) {
    // Mid-late (Lv8-12): Base 2.1x, then 25% per level
    hpMultiplier = 2.1 + (enemyLevel - DIFFICULTY_CURVE.MID_GAME_LEVEL) * DIFFICULTY_CURVE.MID_LATE_GROWTH;
  } else {
    // Late game (Lv13+): Base 3.35x, then 30% per level
    hpMultiplier = 3.35 + (enemyLevel - DIFFICULTY_CURVE.LATE_GAME_LEVEL) * DIFFICULTY_CURVE.LATE_GROWTH;
  }

  // Apply rank bonus to HP
  const rankBonus = DIFFICULTY_CURVE.RANK_MULTIPLIERS[rank];
  const maxHp = Math.floor(template.baseHp * hpMultiplier * rankBonus);

  // Attack and defense use simpler linear scaling
  const levelMultiplier = 1 + (enemyLevel - 1) * 0.1;
  const attack = Math.floor(template.baseAttack * levelMultiplier);
  const defense = Math.floor(template.baseDefense * levelMultiplier);

  // Calculate rewards
  const rankMultiplier = { D: 1, C: 1.5, B: 2.5, A: 4 }[rank];
  const goldReward = isTreasure
    ? (template as TreasureTemplate).goldReward
    : Math.floor((20 + enemyLevel * 5) * rankMultiplier);
  const expReward = isTreasure ? 10 : Math.floor((15 + enemyLevel * 3) * rankMultiplier);

  // Treasure monsters may drop food items
  const items: string[] = [];
  if (isTreasure) {
    // NOTE: 所有 key 必须在 ALL_ITEMS 中存在，否则结算奖励时会因找不到物品模板而报错。
    // 这里去掉了未定义的 'CHEESE'，仅保留已有的消耗品 key。
    const foodItems = ['BREAD', 'POTION', 'STAMINA_STEW'];
    const itemCount = 2 + Math.floor(Math.random() * 3); // 2-4 items
    for (let i = 0; i < itemCount; i++) {
      items.push(foodItems[Math.floor(Math.random() * foodItems.length)]);
    }
  }

  return {
    id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    level: enemyLevel,
    rank,
    currentHp: maxHp,
    maxHp,
    attack,
    defense,
    isTreasureMonster: isTreasure,
    rewards: {
      gold: goldReward,
      exp: expReward,
      items: items.length > 0 ? items : undefined,
    },
  };
}

/**
 * Determine enemy rank based on player level
 * Higher levels have higher chances of encountering stronger enemies
 */
function determineEnemyRank(playerLevel: number): 'D' | 'C' | 'B' | 'A' {
  const roll = Math.random();

  if (playerLevel < 5) {
    // Early game: mostly D, some C
    return roll < 0.7 ? 'D' : 'C';
  } else if (playerLevel < 10) {
    // Mid-early: D/C/B mix
    if (roll < 0.3) return 'D';
    if (roll < 0.8) return 'C';
    return 'B';
  } else if (playerLevel < 20) {
    // Mid-late: C/B/A mix
    if (roll < 0.3) return 'C';
    if (roll < 0.8) return 'B';
    return 'A';
  } else {
    // Late game: mostly B/A
    return roll < 0.5 ? 'B' : 'A';
  }
}

/**
 * Main function: Start a random encounter
 * - 默认：10% 概率遇到珍宝怪，其余为普通敌人
 * - 调试模式：forceTreasure 为 true 时，必定生成珍宝怪
 */
export function encounterRandomEnemy(
  playerLevel: number,
  location: string,
  forceTreasure: boolean = false
): Enemy {
  // Dev mode: always encounter treasure monster
  if (forceTreasure) {
    const template = TREASURE_MONSTERS[Math.floor(Math.random() * TREASURE_MONSTERS.length)];
    return generateEnemyFromTemplate(template, 'D', playerLevel, true);
  }

  // Normal random chance for treasure monster
  if (Math.random() < COMBAT_CONFIG.TREASURE_MONSTER_PROBABILITY) {
    const template = TREASURE_MONSTERS[Math.floor(Math.random() * TREASURE_MONSTERS.length)];
    return generateEnemyFromTemplate(template, 'D', playerLevel, true);
  }

  // Normal enemy
  const rank = determineEnemyRank(playerLevel);
  const templates = ENEMY_TEMPLATES[rank];
  const template = templates[Math.floor(Math.random() * templates.length)];

  return generateEnemyFromTemplate(template, rank, playerLevel, false);
}

/**
 * Get max turns for enemy (treasure monsters have shorter limit)
 */
export function getMaxTurns(enemy: Enemy): number {
  return enemy.isTreasureMonster ? COMBAT_CONFIG.TREASURE_MAX_TURNS : COMBAT_CONFIG.MAX_TURNS;
}
