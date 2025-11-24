/**
 * Enemy System - Enemy Generation and Templates
 * Handles enemy creation based on player level and location
 */

import { Enemy, BiomeType, EnemyFamily, ElementType } from '../../types';
import { COMBAT_CONFIG } from '../config/combatConfig';
import { IMAGES } from '../../constants';
import { RegionConfig } from '../config/worldRegions';

// Enemy template structure
interface EnemyTemplate {
  name: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  // Phase 2 Expansion: Visual Identity & Location
  icon: string;
  family: EnemyFamily;
  element: ElementType;
  biomes: BiomeType[];
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
    {
      name: '哥布林斥候', baseHp: 60, baseAttack: 6, baseDefense: 2,
      icon: IMAGES.icons.enemyGoblinScout, family: 'goblin', element: 'none',
      biomes: ['forest', 'plains', 'mountains']
    },
    {
      name: '路边强盗', baseHp: 65, baseAttack: 7, baseDefense: 2,
      icon: IMAGES.icons.enemyRoadBandit, family: 'human', element: 'none',
      biomes: ['plains', 'forest', 'capital']
    },
    {
      name: '野猪', baseHp: 70, baseAttack: 7, baseDefense: 3,
      icon: IMAGES.icons.enemyWildBoar, family: 'beast', element: 'none',
      biomes: ['forest', 'plains', 'mountains']
    },
    {
      name: '幼年树人', baseHp: 75, baseAttack: 6, baseDefense: 4,
      icon: IMAGES.icons.enemyYoungTreant, family: 'elemental', element: 'nature',
      biomes: ['forest']
    },
    {
      name: '洞穴蝙蝠', baseHp: 55, baseAttack: 6, baseDefense: 2,
      icon: IMAGES.icons.enemyCaveBat, family: 'beast', element: 'none',
      biomes: ['cave', 'ruins']
    },
    {
      name: '蓝色史莱姆', baseHp: 50, baseAttack: 5, baseDefense: 2,
      icon: IMAGES.icons.enemyBlueSlime, family: 'slime', element: 'none',
      biomes: ['forest', 'plains', 'swamp', 'cave']
    },
    {
      name: '骸骨士兵', baseHp: 65, baseAttack: 7, baseDefense: 3,
      icon: IMAGES.icons.enemyBoneSoldier, family: 'undead', element: 'shadow',
      biomes: ['ruins', 'wasteland']
    },
    {
      name: '下水道巨鼠', baseHp: 55, baseAttack: 5, baseDefense: 1,
      icon: IMAGES.icons.enemySewerRat, family: 'beast', element: 'none',
      biomes: ['capital', 'cave']
    },
    {
      name: '洞穴蜘蛛', baseHp: 60, baseAttack: 6, baseDefense: 3,
      icon: IMAGES.icons.enemyCaveSpider, family: 'insect', element: 'none',
      biomes: ['cave', 'forest', 'ruins']
    },
    {
      name: '训练木桩', baseHp: 45, baseAttack: 4, baseDefense: 1,
      icon: IMAGES.icons.enemyTrainingDummy, family: 'construct', element: 'none',
      biomes: ['capital']
    },
    {
      name: '石像傀儡', baseHp: 80, baseAttack: 5, baseDefense: 5,
      icon: IMAGES.icons.enemyStoneGolem, family: 'construct', element: 'none',
      biomes: ['ruins', 'mountains', 'cave']
    },
    {
      name: '小恶魔', baseHp: 55, baseAttack: 7, baseDefense: 2,
      icon: IMAGES.icons.enemyImpDevil, family: 'demon', element: 'fire',
      biomes: ['wasteland', 'ruins', 'cave']
    },
    {
      name: '森林精灵', baseHp: 60, baseAttack: 5, baseDefense: 3,
      icon: IMAGES.icons.enemyForestFairy, family: 'elemental', element: 'nature',
      biomes: ['forest']
    },
    {
      name: '愤怒蘑菇', baseHp: 55, baseAttack: 6, baseDefense: 2,
      icon: IMAGES.icons.enemyAngryShroom, family: 'elemental', element: 'nature',
      biomes: ['forest', 'swamp']
    },
    {
      name: '幼年飞龙', baseHp: 80, baseAttack: 8, baseDefense: 3,
      icon: IMAGES.icons.enemyBabyDrake, family: 'dragon', element: 'fire',
      biomes: ['mountains', 'wasteland']
    },
    {
      name: '柔弱幽灵', baseHp: 50, baseAttack: 5, baseDefense: 1,
      icon: IMAGES.icons.enemySoftGhost, family: 'undead', element: 'shadow',
      biomes: ['ruins', 'wasteland', 'cave']
    },
  ],
  C: [
    {
      name: '野性猛虎', baseHp: 120, baseAttack: 12, baseDefense: 5,
      icon: IMAGES.icons.enemyFeralTiger, family: 'beast', element: 'none',
      biomes: ['forest', 'mountains', 'plains']
    },
    {
      name: '狼人', baseHp: 130, baseAttack: 13, baseDefense: 6,
      icon: IMAGES.icons.enemyWerewolf, family: 'beast', element: 'shadow',
      biomes: ['forest', 'mountains']
    },
    {
      name: '海洋巨蛇', baseHp: 140, baseAttack: 14, baseDefense: 5,
      icon: IMAGES.icons.enemySeaSerpent, family: 'beast', element: 'ice',
      biomes: ['swamp']
    },
    {
      name: '吸血领主', baseHp: 120, baseAttack: 16, baseDefense: 4,
      icon: IMAGES.icons.enemyVampireLord, family: 'undead', element: 'shadow',
      biomes: ['ruins', 'wasteland']
    },
    {
      name: '骑乘骑士', baseHp: 135, baseAttack: 13, baseDefense: 7,
      icon: IMAGES.icons.enemyMountedKnight, family: 'human', element: 'none',
      biomes: ['plains', 'mountains']
    },
    {
      name: '黑暗宰相', baseHp: 110, baseAttack: 17, baseDefense: 5,
      icon: IMAGES.icons.enemyDarkVizier, family: 'human', element: 'shadow',
      biomes: ['ruins', 'wasteland']
    },
    {
      name: '傲翼狮鹫', baseHp: 130, baseAttack: 14, baseDefense: 6,
      icon: IMAGES.icons.enemyProudGriffin, family: 'beast', element: 'thunder',
      biomes: ['mountains']
    },
    {
      name: '冰霜食人魔', baseHp: 150, baseAttack: 15, baseDefense: 8,
      icon: IMAGES.icons.enemyFrostOgre, family: 'beast', element: 'ice',
      biomes: ['mountains', 'cave']
    },
    {
      name: '火焰巨龙', baseHp: 150, baseAttack: 18, baseDefense: 7,
      icon: IMAGES.icons.enemyFireDragon, family: 'dragon', element: 'fire',
      biomes: ['mountains', 'wasteland']
    },
    {
      name: '暗影游侠', baseHp: 115, baseAttack: 16, baseDefense: 4,
      icon: IMAGES.icons.enemyDarkRanger, family: 'human', element: 'shadow',
      biomes: ['forest', 'ruins']
    },
    {
      name: '白骨将军', baseHp: 140, baseAttack: 17, baseDefense: 7,
      icon: IMAGES.icons.enemyBoneGeneral, family: 'undead', element: 'shadow',
      biomes: ['ruins', 'wasteland']
    },
    {
      name: '海妖美杜莎', baseHp: 125, baseAttack: 15, baseDefense: 6,
      icon: IMAGES.icons.enemySeaMedusa, family: 'beast', element: 'ice',
      biomes: ['swamp']
    },
    {
      name: '棘刺巨像', baseHp: 155, baseAttack: 14, baseDefense: 9,
      icon: IMAGES.icons.enemySpikedColossus, family: 'construct', element: 'none',
      biomes: ['ruins', 'wasteland', 'mountains']
    },
    {
      name: '地狱骑士', baseHp: 145, baseAttack: 18, baseDefense: 8,
      icon: IMAGES.icons.enemyHellKnight, family: 'demon', element: 'fire',
      biomes: ['wasteland', 'ruins']
    },
    {
      name: '哥布林飞艇', baseHp: 130, baseAttack: 13, baseDefense: 6,
      icon: IMAGES.icons.enemyGoblinAirship, family: 'goblin', element: 'none',
      biomes: ['plains', 'mountains']
    },
    {
      name: '影子忍者', baseHp: 115, baseAttack: 17, baseDefense: 4,
      icon: IMAGES.icons.enemyShadowNinja, family: 'human', element: 'shadow',
      biomes: ['capital', 'ruins']
    },
  ],
  B: [
    {
      name: '符文巨像', baseHp: 220, baseAttack: 22, baseDefense: 14,
      icon: IMAGES.icons.bossRuneColossus, family: 'construct', element: 'none',
      biomes: ['ruins', 'mountains']
    },
    {
      name: '死亡骑士', baseHp: 210, baseAttack: 26, baseDefense: 13,
      icon: IMAGES.icons.bossDeathKnight, family: 'undead', element: 'shadow',
      biomes: ['ruins', 'wasteland']
    },
    {
      name: '水晶巨人', baseHp: 230, baseAttack: 24, baseDefense: 15,
      icon: IMAGES.icons.bossCrystalGiant, family: 'construct', element: 'ice',
      biomes: ['cave', 'mountains']
    },
    {
      name: '钢铁勇士', baseHp: 200, baseAttack: 23, baseDefense: 16,
      icon: IMAGES.icons.bossIronChampion, family: 'construct', element: 'none',
      biomes: ['ruins', 'wasteland']
    },
    {
      name: '符文石像鬼', baseHp: 210, baseAttack: 21, baseDefense: 12,
      icon: IMAGES.icons.bossRuneGargoyle, family: 'construct', element: 'shadow',
      biomes: ['ruins', 'mountains']
    },
  ],
  A: [
    {
      name: '炼狱巨龙', baseHp: 340, baseAttack: 38, baseDefense: 22,
      icon: IMAGES.icons.bossInfernoDragon, family: 'dragon', element: 'fire',
      biomes: ['wasteland', 'mountains']
    },
    {
      name: '炼狱魔君', baseHp: 320, baseAttack: 40, baseDefense: 24,
      icon: IMAGES.icons.bossInfernalLord, family: 'demon', element: 'fire',
      biomes: ['wasteland']
    },
    {
      name: '烈焰凤凰', baseHp: 310, baseAttack: 36, baseDefense: 20,
      icon: IMAGES.icons.bossBlazePhoenix, family: 'elemental', element: 'fire',
      biomes: ['wasteland', 'mountains']
    },
    {
      name: '奥术贤者', baseHp: 300, baseAttack: 34, baseDefense: 18,
      icon: IMAGES.icons.bossArcaneSage, family: 'human', element: 'holy',
      biomes: ['ruins']
    },
    {
      name: '宇宙巨龙', baseHp: 360, baseAttack: 42, baseDefense: 23,
      icon: IMAGES.icons.bossCosmosDragon, family: 'dragon', element: 'holy',
      biomes: ['mountains']
    },
    {
      name: '虚空恐魔', baseHp: 330, baseAttack: 39, baseDefense: 21,
      icon: IMAGES.icons.bossVoidHorror, family: 'demon', element: 'shadow',
      biomes: ['wasteland', 'ruins']
    },
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
    icon: IMAGES.icons.bossJewelBeetle,
    family: 'insect',
    element: 'none',
    biomes: ['cave', 'ruins', 'forest', 'mountains', 'wasteland', 'plains', 'swamp', 'capital'],
  },
  {
    name: '皇家史莱姆',
    baseHp: 60,
    baseAttack: 3,
    baseDefense: 3,
    goldReward: 1000,
    maxTurns: 3,
    icon: IMAGES.icons.bossRoyalSlime,
    family: 'slime',
    element: 'none',
    biomes: ['cave', 'ruins', 'forest', 'mountains', 'wasteland', 'plains', 'swamp', 'capital'],
  },
  {
    name: '诅咒宝箱',
    baseHp: 55,
    baseAttack: 4,
    baseDefense: 4,
    goldReward: 1200,
    maxTurns: 3,
    icon: IMAGES.icons.bossCursedChest,
    family: 'construct',
    element: 'shadow',
    biomes: ['cave', 'ruins', 'forest', 'mountains', 'wasteland', 'plains', 'swamp', 'capital'],
  },
  {
    name: '星光精灵',
    baseHp: 40,
    baseAttack: 2,
    baseDefense: 3,
    goldReward: 850,
    maxTurns: 3,
    icon: IMAGES.icons.bossStarlightFairy,
    family: 'elemental',
    element: 'holy',
    biomes: ['cave', 'ruins', 'forest', 'mountains', 'wasteland', 'plains', 'swamp', 'capital'],
  },
  {
    name: '彩虹化身',
    baseHp: 50,
    baseAttack: 3,
    baseDefense: 3,
    goldReward: 1100,
    maxTurns: 3,
    icon: IMAGES.icons.bossRainbowAvatar,
    family: 'elemental',
    element: 'holy',
    biomes: ['cave', 'ruins', 'forest', 'mountains', 'wasteland', 'plains', 'swamp', 'capital'],
  },
];

/**
 * Get target enemy level based on region config and player level
 * Implements static phase (fixed region levels) and dynamic phase (scaling with player)
 *
 * @param region - Region configuration with level range and scaling settings
 * @param playerLevel - Current player level
 * @returns Target enemy level for generation
 */
function getTargetEnemyLevel(region: RegionConfig, playerLevel: number): number {
  const { levelRange, tier, scaling } = region;
  const { min, max } = levelRange;

  // Static Phase: Player level is within or close to region's recommended range
  const withinStatic = playerLevel <= max + scaling.staticBuffer;
  if (withinStatic) {
    // Use region's fixed level range with ±1 variance for variety
    const baseLevel = min + Math.floor(Math.random() * (max - min + 1));
    const variance = Math.floor(Math.random() * 3) - 1; // -1 to +1
    return Math.max(min, Math.min(max, baseLevel + variance));
  }

  // Dynamic Phase: Player level exceeds region + buffer, scale relative to player
  const minDiff = scaling.minDiffByTier[tier];
  const maxDiff = scaling.maxDiffByTier[tier];

  const baseMin = playerLevel + minDiff;
  const baseMax = playerLevel + maxDiff;

  // Clamp to reasonable bounds: never below region min, never above 99
  const scaledMin = Math.max(min, baseMin);
  const scaledMax = Math.min(99, Math.max(scaledMin, baseMax));

  // Random level in the scaled range
  return scaledMin + Math.floor(Math.random() * (scaledMax - scaledMin + 1));
}

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
    // Phase 2 Expansion: Copy metadata from template
    icon: template.icon,
    family: template.family,
    element: template.element,
    biomes: template.biomes,
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
 * - Phase 2: 支持区域配置，根据地形筛选敌人池
 */
export function encounterRandomEnemy(
  playerLevel: number,
  location: string,
  forceTreasure: boolean = false,
  region?: RegionConfig | null
): Enemy {
  // Calculate target enemy level (for region-aware generation)
  let targetLevel = playerLevel;
  if (region) {
    targetLevel = getTargetEnemyLevel(region, playerLevel);
  }

  // Dev mode: always encounter treasure monster
  if (forceTreasure) {
    const template = TREASURE_MONSTERS[Math.floor(Math.random() * TREASURE_MONSTERS.length)];
    return generateEnemyFromTemplate(template, 'D', targetLevel, true);
  }

  // Normal random chance for treasure monster
  if (Math.random() < COMBAT_CONFIG.TREASURE_MONSTER_PROBABILITY) {
    const template = TREASURE_MONSTERS[Math.floor(Math.random() * TREASURE_MONSTERS.length)];
    return generateEnemyFromTemplate(template, 'D', targetLevel, true);
  }

  // Normal enemy - filter by region biomes if available
  const rank = determineEnemyRank(playerLevel);
  let templates = ENEMY_TEMPLATES[rank];

  // Phase 2: Filter templates by region biomes
  if (region && region.biomes.length > 0) {
    const filtered = templates.filter((t) =>
      t.biomes.some((biome) => region.biomes.includes(biome))
    );
    // Fallback to full pool if no matches (shouldn't happen with good config)
    if (filtered.length > 0) {
      templates = filtered;
    }
  }

  const template = templates[Math.floor(Math.random() * templates.length)];
  return generateEnemyFromTemplate(template, rank, targetLevel, false);
}

/**
 * Get max turns for enemy (treasure monsters have shorter limit)
 */
export function getMaxTurns(enemy: Enemy): number {
  return enemy.isTreasureMonster ? COMBAT_CONFIG.TREASURE_MAX_TURNS : COMBAT_CONFIG.MAX_TURNS;
}

/**
 * Export getTargetEnemyLevel for risk assessment in UI
 */
export { getTargetEnemyLevel };
