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
    { name: '哥布林斥候', baseHp: 60, baseAttack: 6, baseDefense: 2 },   // enemyGoblinScout
    { name: '路边强盗', baseHp: 65, baseAttack: 7, baseDefense: 2 },     // enemyRoadBandit
    { name: '野猪', baseHp: 70, baseAttack: 7, baseDefense: 3 },         // enemyWildBoar
    { name: '幼年树人', baseHp: 75, baseAttack: 6, baseDefense: 4 },     // enemyYoungTreant
    { name: '洞穴蝙蝠', baseHp: 55, baseAttack: 6, baseDefense: 2 },     // enemyCaveBat
    { name: '蓝色史莱姆', baseHp: 50, baseAttack: 5, baseDefense: 2 },   // enemyBlueSlime
    { name: '骸骨士兵', baseHp: 65, baseAttack: 7, baseDefense: 3 },     // enemyBoneSoldier
    { name: '下水道巨鼠', baseHp: 55, baseAttack: 5, baseDefense: 1 },   // enemySewerRat
    { name: '洞穴蜘蛛', baseHp: 60, baseAttack: 6, baseDefense: 3 },     // enemyCaveSpider
    { name: '训练木桩', baseHp: 45, baseAttack: 4, baseDefense: 1 },     // enemyTrainingDummy
    { name: '石像傀儡', baseHp: 80, baseAttack: 5, baseDefense: 5 },     // enemyStoneGolem
    { name: '小恶魔', baseHp: 55, baseAttack: 7, baseDefense: 2 },       // enemyImpDevil
    { name: '森林精灵', baseHp: 60, baseAttack: 5, baseDefense: 3 },     // enemyForestFairy
    { name: '愤怒蘑菇', baseHp: 55, baseAttack: 6, baseDefense: 2 },     // enemyAngryShroom
    { name: '幼年飞龙', baseHp: 80, baseAttack: 8, baseDefense: 3 },     // enemyBabyDrake
    { name: '柔弱幽灵', baseHp: 50, baseAttack: 5, baseDefense: 1 },     // enemySoftGhost
  ],
  C: [
    { name: '野性猛虎', baseHp: 120, baseAttack: 12, baseDefense: 5 },    // enemyFeralTiger
    { name: '狼人', baseHp: 130, baseAttack: 13, baseDefense: 6 },        // enemyWerewolf
    { name: '海洋巨蛇', baseHp: 140, baseAttack: 14, baseDefense: 5 },    // enemySeaSerpent
    { name: '吸血领主', baseHp: 120, baseAttack: 16, baseDefense: 4 },    // enemyVampireLord
    { name: '骑乘骑士', baseHp: 135, baseAttack: 13, baseDefense: 7 },    // enemyMountedKnight
    { name: '黑暗宰相', baseHp: 110, baseAttack: 17, baseDefense: 5 },    // enemyDarkVizier
    { name: '傲翼狮鹫', baseHp: 130, baseAttack: 14, baseDefense: 6 },    // enemyProudGriffin
    { name: '冰霜食人魔', baseHp: 150, baseAttack: 15, baseDefense: 8 },  // enemyFrostOgre
    { name: '火焰巨龙', baseHp: 150, baseAttack: 18, baseDefense: 7 },    // enemyFireDragon
    { name: '暗影游侠', baseHp: 115, baseAttack: 16, baseDefense: 4 },    // enemyDarkRanger
    { name: '白骨将军', baseHp: 140, baseAttack: 17, baseDefense: 7 },    // enemyBoneGeneral
    { name: '海妖美杜莎', baseHp: 125, baseAttack: 15, baseDefense: 6 },  // enemySeaMedusa
    { name: '棘刺巨像', baseHp: 155, baseAttack: 14, baseDefense: 9 },    // enemySpikedColossus
    { name: '地狱骑士', baseHp: 145, baseAttack: 18, baseDefense: 8 },    // enemyHellKnight
    { name: '哥布林飞艇', baseHp: 130, baseAttack: 13, baseDefense: 6 },  // enemyGoblinAirship
    { name: '影子忍者', baseHp: 115, baseAttack: 17, baseDefense: 4 },    // enemyShadowNinja
  ],
  B: [
    { name: '符文巨像', baseHp: 220, baseAttack: 22, baseDefense: 14 },   // bossRuneColossus
    { name: '死亡骑士', baseHp: 210, baseAttack: 26, baseDefense: 13 },   // bossDeathKnight
    { name: '水晶巨人', baseHp: 230, baseAttack: 24, baseDefense: 15 },   // bossCrystalGiant
    { name: '钢铁勇士', baseHp: 200, baseAttack: 23, baseDefense: 16 },   // bossIronChampion
    { name: '符文石像鬼', baseHp: 210, baseAttack: 21, baseDefense: 12 }, // bossRuneGargoyle
  ],
  A: [
    { name: '炼狱巨龙', baseHp: 340, baseAttack: 38, baseDefense: 22 },   // bossInfernoDragon
    { name: '炼狱魔君', baseHp: 320, baseAttack: 40, baseDefense: 24 },   // bossInfernalLord
    { name: '烈焰凤凰', baseHp: 310, baseAttack: 36, baseDefense: 20 },   // bossBlazePhoenix
    { name: '奥术贤者', baseHp: 300, baseAttack: 34, baseDefense: 18 },   // bossArcaneSage
    { name: '宇宙巨龙', baseHp: 360, baseAttack: 42, baseDefense: 23 },   // bossCosmosDragon
    { name: '虚空恐魔', baseHp: 330, baseAttack: 39, baseDefense: 21 },   // bossVoidHorror
  ],
};

/**
 * Treasure monster templates
 * Low stats, short turns, high gold rewards
 */
const TREASURE_MONSTERS: TreasureTemplate[] = [
  {
    name: '宝石甲虫',
    baseHp: 45,
    baseAttack: 3,
    baseDefense: 4,
    goldReward: 900,
    maxTurns: 3,
  },
  {
    name: '皇家史莱姆',
    baseHp: 60,
    baseAttack: 3,
    baseDefense: 3,
    goldReward: 1000,
    maxTurns: 3,
  },
  {
    name: '诅咒宝箱',
    baseHp: 55,
    baseAttack: 4,
    baseDefense: 4,
    goldReward: 1200,
    maxTurns: 3,
  },
  {
    name: '星光精灵',
    baseHp: 40,
    baseAttack: 2,
    baseDefense: 3,
    goldReward: 850,
    maxTurns: 3,
  },
  {
    name: '彩虹化身',
    baseHp: 50,
    baseAttack: 3,
    baseDefense: 3,
    goldReward: 1100,
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
