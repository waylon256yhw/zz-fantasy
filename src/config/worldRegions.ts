/**
 * World Regions Configuration - Phase 2 Expansion
 * Defines difficulty zones, level ranges, and biome mappings for the game world
 */

import { BiomeType } from '../../types';

export type RegionTier = 'low' | 'mid' | 'high' | 'endgame';

export interface RegionConfig {
  id: string;
  name: string;
  levelRange: { min: number; max: number };
  tier: RegionTier;
  biomes: BiomeType[];
  scaling: {
    enabled: boolean;
    staticBuffer: number; // How many levels above max before dynamic scaling kicks in
    minDiffByTier: Record<RegionTier, number>; // Relative to player level in dynamic phase
    maxDiffByTier: Record<RegionTier, number>; // Relative to player level in dynamic phase
  };
}

/**
 * Region scaling configuration
 * Controls how enemy levels scale relative to player level after static phase
 */
const REGION_SCALING_CONFIG = {
  enabled: true,
  staticBuffer: 2,
  minDiffByTier: {
    low: -3,      // Low regions: enemies 3 levels below player
    mid: -1,      // Mid regions: enemies 1 level below player
    high: +1,     // High regions: enemies 1 level above player
    endgame: +2,  // Endgame regions: enemies 2 levels above player
  },
  maxDiffByTier: {
    low: -1,      // Low regions: up to 1 level below player
    mid: +1,      // Mid regions: up to 1 level above player
    high: +3,     // High regions: up to 3 levels above player
    endgame: +4,  // Endgame regions: up to 4 levels above player
  },
};

/**
 * All regions in the game world
 */
export const WORLD_REGIONS: RegionConfig[] = [
  {
    id: 'capital_starter',
    name: '王都初始区',
    levelRange: { min: 1, max: 3 },
    tier: 'low',
    biomes: ['capital'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'capital_downtown',
    name: '王都市区',
    levelRange: { min: 2, max: 5 },
    tier: 'low',
    biomes: ['capital'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'plains_outskirts',
    name: '郊外平原',
    levelRange: { min: 3, max: 6 },
    tier: 'low',
    biomes: ['plains', 'forest'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'forest_entrance',
    name: '森林入口',
    levelRange: { min: 4, max: 7 },
    tier: 'mid',
    biomes: ['forest'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'forest_depths',
    name: '森林深处',
    levelRange: { min: 6, max: 10 },
    tier: 'mid',
    biomes: ['forest', 'swamp'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'ancient_ruins',
    name: '古代遗迹',
    levelRange: { min: 8, max: 12 },
    tier: 'mid',
    biomes: ['ruins', 'cave'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'mountain_foothills',
    name: '山脉山麓',
    levelRange: { min: 10, max: 14 },
    tier: 'high',
    biomes: ['mountains', 'plains'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'mountain_peaks',
    name: '山脉顶峰',
    levelRange: { min: 13, max: 18 },
    tier: 'high',
    biomes: ['mountains', 'cave'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'cursed_wasteland',
    name: '诅咒荒地',
    levelRange: { min: 15, max: 22 },
    tier: 'high',
    biomes: ['wasteland', 'ruins'],
    scaling: REGION_SCALING_CONFIG,
  },
  {
    id: 'void_chasm',
    name: '虚空深渊',
    levelRange: { min: 20, max: 30 },
    tier: 'endgame',
    biomes: ['wasteland', 'cave', 'ruins'],
    scaling: REGION_SCALING_CONFIG,
  },
];

/**
 * Location-to-Region mapping
 * Maps location strings from the game to region IDs
 */
export const LOCATION_REGION_MAP: Record<string, string> = {
  // Capital areas
  '王都阿斯拉 - 中央广场': 'capital_starter',
  '王都阿斯拉 - 贵族区': 'capital_downtown',
  '王都阿斯拉 - 商业区': 'capital_downtown',
  '王都阿斯拉 - 下城区': 'capital_starter',
  '王都阿斯拉 - 训练场': 'capital_starter',

  // Plains and outskirts
  '郊外 - 田野': 'plains_outskirts',
  '郊外 - 小路': 'plains_outskirts',
  '郊外 - 村庄': 'plains_outskirts',

  // Forest areas
  '翡翠森林 - 入口': 'forest_entrance',
  '翡翠森林 - 林间小径': 'forest_entrance',
  '翡翠森林 - 深林': 'forest_depths',
  '翡翠森林 - 迷雾区': 'forest_depths',
  '翡翠森林 - 沼泽边缘': 'forest_depths',

  // Ruins
  '古代遗迹 - 外围': 'ancient_ruins',
  '古代遗迹 - 大厅': 'ancient_ruins',
  '古代遗迹 - 地下墓室': 'ancient_ruins',
  '古代遗迹 - 禁地': 'ancient_ruins',

  // Mountains
  '暮光山脉 - 山脚': 'mountain_foothills',
  '暮光山脉 - 山腰': 'mountain_foothills',
  '暮光山脉 - 山顶': 'mountain_peaks',
  '暮光山脉 - 雪峰': 'mountain_peaks',
  '暮光山脉 - 洞穴': 'mountain_peaks',

  // Wasteland
  '诅咒之地 - 边界': 'cursed_wasteland',
  '诅咒之地 - 废墟': 'cursed_wasteland',
  '诅咒之地 - 深渊裂隙': 'void_chasm',
  '诅咒之地 - 虚空核心': 'void_chasm',
};

/**
 * Get region config by location string
 */
export function getRegionByLocation(location: string): RegionConfig | null {
  const regionId = LOCATION_REGION_MAP[location];
  if (!regionId) return null;
  return WORLD_REGIONS.find((r) => r.id === regionId) || null;
}

/**
 * Get region config by ID
 */
export function getRegionById(regionId: string): RegionConfig | null {
  return WORLD_REGIONS.find((r) => r.id === regionId) || null;
}

/**
 * Check if a location is mapped to a region
 */
export function isLocationMapped(location: string): boolean {
  return location in LOCATION_REGION_MAP;
}
