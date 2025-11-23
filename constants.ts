import { CharacterStats, ClassType, Item, Quest } from "./types";

export const ASSET_BASE_URL = "https://pub-12f2a3bd170342c18c0c3de229cb60c7.r2.dev";
const ILLUSTRATION_ICON_PATH = `${ASSET_BASE_URL}/插画图标`;

export const IMAGES = {
  bg: {
    guild: `${ASSET_BASE_URL}/guild.jpeg`,
    plaza: `${ASSET_BASE_URL}/plaza.jpeg`,
    valley: `${ASSET_BASE_URL}/valley.jpeg`,
  },
  char: {
    test: `${ASSET_BASE_URL}/test-portrait.jpeg`,
  },
  icons: {
    // 基础与遗留（保持原有引用兼容）
    book: `${ILLUSTRATION_ICON_PATH}/book.png`,
    diamond: `${ILLUSTRATION_ICON_PATH}/diamond.png`,
    fight: `${ILLUSTRATION_ICON_PATH}/fight.png`,
    fire: `${ILLUSTRATION_ICON_PATH}/fire.png`,
    goblin: `${ILLUSTRATION_ICON_PATH}/goblin.png`,
    gold: `${ILLUSTRATION_ICON_PATH}/gold.png`,
    house: `${ILLUSTRATION_ICON_PATH}/house.png`,
    knight: `${ILLUSTRATION_ICON_PATH}/knight.png`,
    potion: `${ILLUSTRATION_ICON_PATH}/potion.png`,
    shield: `${ILLUSTRATION_ICON_PATH}/shield.png`,
    skull: `${ILLUSTRATION_ICON_PATH}/skull.png`,
    sword: `${ILLUSTRATION_ICON_PATH}/sword.png`,
    treasure: `${ILLUSTRATION_ICON_PATH}/treasure.png`,
    trunk: `${ILLUSTRATION_ICON_PATH}/trunk.png`,
    wand: `${ILLUSTRATION_ICON_PATH}/wand.png`,
    wings: `${ILLUSTRATION_ICON_PATH}/wings.png`,

    // 食物 / 饮品
    apple: `${ILLUSTRATION_ICON_PATH}/apple.png`,
    bread: `${ILLUSTRATION_ICON_PATH}/bread.png`,
    beer: `${ILLUSTRATION_ICON_PATH}/beer.png`,
    berries: `${ILLUSTRATION_ICON_PATH}/berries.png`,
    cake: `${ILLUSTRATION_ICON_PATH}/cake.png`,
    croissant: `${ILLUSTRATION_ICON_PATH}/croissant.png`,
    fish: `${ILLUSTRATION_ICON_PATH}/fish.png`,
    juice: `${ILLUSTRATION_ICON_PATH}/juice.png`,
    kebab: `${ILLUSTRATION_ICON_PATH}/kebab.png`,
    loaf: `${ILLUSTRATION_ICON_PATH}/loaf.png`,
    meat: `${ILLUSTRATION_ICON_PATH}/meat.png`,
    pancakes: `${ILLUSTRATION_ICON_PATH}/pancakes.png`,
    pie: `${ILLUSTRATION_ICON_PATH}/pie.png`,
    ramen: `${ILLUSTRATION_ICON_PATH}/ramen.png`,
    rice: `${ILLUSTRATION_ICON_PATH}/rice.png`,
    stew: `${ILLUSTRATION_ICON_PATH}/stew.png`,
    sushi: `${ILLUSTRATION_ICON_PATH}/sushi.png`,
    tart: `${ILLUSTRATION_ICON_PATH}/tart.png`,

    // 日用品 / 便携工具
    banner: `${ILLUSTRATION_ICON_PATH}/banner.png`,
    compass: `${ILLUSTRATION_ICON_PATH}/compass.png`,
    goblet: `${ILLUSTRATION_ICON_PATH}/goblet.png`,
    key: `${ILLUSTRATION_ICON_PATH}/key.png`,
    scroll: `${ILLUSTRATION_ICON_PATH}/scroll.png`,
    stones: `${ILLUSTRATION_ICON_PATH}/stones.png`,

    // 武器 / 装备
    boots: `${ILLUSTRATION_ICON_PATH}/boots.png`,
    crossbow: `${ILLUSTRATION_ICON_PATH}/crossbow.png`,
    quiver: `${ILLUSTRATION_ICON_PATH}/quiver.png`,

    // 探索 / 采集 / 奥术
    herbs: `${ILLUSTRATION_ICON_PATH}/herbs.png`,
    orb: `${ILLUSTRATION_ICON_PATH}/orb.png`,
    purplePotion: `${ILLUSTRATION_ICON_PATH}/purple_potion.png`,
    runeStone: `${ILLUSTRATION_ICON_PATH}/rune_stone.png`,

    // 高级宝物 / 圣物
    crown: `${ILLUSTRATION_ICON_PATH}/crown.png`,
    ring: `${ILLUSTRATION_ICON_PATH}/ring.png`,
    cthulhuIdol: `${ILLUSTRATION_ICON_PATH}/cthulhu_idol.png`,
    dragonFang: `${ILLUSTRATION_ICON_PATH}/dragon_fang.png`,
    dragonShield: `${ILLUSTRATION_ICON_PATH}/dragon_shield.png`,
    flameSword: `${ILLUSTRATION_ICON_PATH}/flame_sword.png`,
    genieLamp: `${ILLUSTRATION_ICON_PATH}/genie_lamp.png`,
    holyBranch: `${ILLUSTRATION_ICON_PATH}/holy_branch.png`,
    infinityGauntlet: `${ILLUSTRATION_ICON_PATH}/infinity_gauntlet.png`,
    jeweledCrown: `${ILLUSTRATION_ICON_PATH}/jeweled_crown.png`,
    legendaryChest: `${ILLUSTRATION_ICON_PATH}/legendary_chest.png`,
    lightningOrb: `${ILLUSTRATION_ICON_PATH}/lightning_orb.png`,
    phoenixFeather2: `${ILLUSTRATION_ICON_PATH}/phoenix_feather.png`,
    skullDagger: `${ILLUSTRATION_ICON_PATH}/skull_dagger.png`,
    spellbook: `${ILLUSTRATION_ICON_PATH}/spellbook.png`,
    starCrystal: `${ILLUSTRATION_ICON_PATH}/star_crystal.png`,
    wingedHourglass: `${ILLUSTRATION_ICON_PATH}/winged_hourglass.png`,
  }
};

export const INITIAL_STATS: Record<ClassType, CharacterStats> = {
  [ClassType.ALCHEMIST]: { STR: 3, DEX: 6, INT: 10, CHA: 5, LUCK: 8 },
  [ClassType.KNIGHT]: { STR: 10, DEX: 5, INT: 4, CHA: 7, LUCK: 4 },
  [ClassType.SKY_PIRATE]: { STR: 6, DEX: 9, INT: 5, CHA: 8, LUCK: 7 },
  [ClassType.SCHOLAR]: { STR: 2, DEX: 4, INT: 12, CHA: 6, LUCK: 5 },
};

export const CLASS_LABELS: Record<ClassType, string> = {
  [ClassType.ALCHEMIST]: "炼金术士",
  [ClassType.KNIGHT]: "王国骑士",
  [ClassType.SKY_PIRATE]: "碧空海盗",
  [ClassType.SCHOLAR]: "遗迹学者",
};

export const CLASS_DESCRIPTIONS: Record<ClassType, string> = {
  [ClassType.ALCHEMIST]: "调合万物的探索者。擅长用智慧解决问题，能将平凡的素材化为神奇的药剂。",
  [ClassType.KNIGHT]: "王国的誓言守护者。拥有高超的防御和力量，性格或许有些固执，但值得信赖。",
  [ClassType.SKY_PIRATE]: "云海中的自由灵魂。思维敏捷，出手更快，视自由为至高无上的宝藏。",
  [ClassType.SCHOLAR]: "古老知识的守护者。解读卢恩符文与尘封的历史，揭示古代文明的秘密。",
};

// Helper to map game classes/genders to specific asset filenames
export const getCharacterImage = (classType: ClassType, gender: string): string => {
  // Map internal ClassType to the Chinese filename prefix provided
  const classFileMap: Record<ClassType, string> = {
    [ClassType.ALCHEMIST]: '法师', // Alchemist -> Mage visuals
    [ClassType.KNIGHT]: '战士',    // Knight -> Warrior visuals
    [ClassType.SKY_PIRATE]: '盗贼', // Sky Pirate -> Thief visuals
    [ClassType.SCHOLAR]: '神官',   // Scholar -> Cleric visuals
  };

  const filePrefix = classFileMap[classType];
  // Default to Female if Non-binary is selected for visuals, or use Male/Female suffix
  const genderSuffix = gender === 'Male' ? '男' : '女';

  return `${ASSET_BASE_URL}/立绘/${filePrefix}-${genderSuffix}.jpeg`;
};

// === 物品常量库 (ALL_ITEMS) ===
// 所有可能出现的物品都必须在这里定义，不允许运行时动态创建新物品
// 只能使用已收录的图标（当前64个，见 IMAGES.icons）
export const ALL_ITEMS = {
  // Consumables (消耗品)
  POTION: { id: 'item_potion', name: '治愈药水', description: '恢复50点生命值。尝起来像樱桃味。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.potion },
  BREAD: { id: 'item_bread', name: '旅行干粮', description: '简单的面包，能果腹。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.treasure },
  APPLE_SNACK: { id: 'item_apple', name: '苹果小食', description: '爽脆的补给，恢复少量生命。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.apple },
  STAMINA_STEW: { id: 'item_stew', name: '猎人炖汤', description: '热气腾腾，补充体力，恢复中量生命。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.stew },
  ARCANE_TONIC: { id: 'item_arcane_tonic', name: '秘药：灵能酿', description: '短时间内提升专注，恢复中量魔力。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.purplePotion },

  // Equipment (装备)
  SWORD: { id: 'item_sword', name: '制式长剑', description: '标准装备，保养良好。', type: 'Equipment' as const, rarity: 'Common' as const, icon: IMAGES.icons.sword },
  SHIELD: { id: 'item_shield', name: '圆盾', description: '刻有纹章的盾牌。', type: 'Equipment' as const, rarity: 'Common' as const, icon: IMAGES.icons.shield },
  WAND: { id: 'item_wand', name: '木杖', description: '简陋的法杖，聚焦魔力。', type: 'Equipment' as const, rarity: 'Common' as const, icon: IMAGES.icons.wand },
  SWIFT_BOOTS: { id: 'item_swift_boots', name: '迅捷行军靴', description: '轻量靴子，行军与闪避更从容。', type: 'Equipment' as const, rarity: 'Rare' as const, icon: IMAGES.icons.boots },
  HUNTER_CROSSBOW: { id: 'item_crossbow', name: '猎手弩', description: '便携的远程武器，常被空贼与侦查兵携带。', type: 'Equipment' as const, rarity: 'Rare' as const, icon: IMAGES.icons.crossbow },
  REINFORCED_QUIVER: { id: 'item_quiver', name: '强化箭囊', description: '加固箭袋，增加携弹上限。', type: 'Equipment' as const, rarity: 'Common' as const, icon: IMAGES.icons.quiver },

  // Materials (素材)
  GOLD_COIN: { id: 'item_gold', name: '金币×10', description: '通用货币。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.gold },
  SLIME_JELLY: { id: 'item_slime', name: '史莱姆果冻', description: '有弹性的凝胶，炼金素材。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.goblin },
  CRYSTAL: { id: 'item_crystal', name: '魔力结晶', description: '蕴含魔力的宝石。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.diamond },
  HERB_BUNDLE: { id: 'item_herbs', name: '药草包', description: '常见草药，基础炼金与疗伤素材。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.herbs },
  RUNE_FRAGMENT: { id: 'item_rune', name: '符文石碎片', description: '刻有微光符文的石片，可作为能量媒介。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.runeStone },
  STAR_CRYSTAL: { id: 'item_star_crystal', name: '星辰结晶', description: '闪烁的结晶，蕴含强大而稳定的能量。', type: 'Material' as const, rarity: 'Epic' as const, icon: IMAGES.icons.starCrystal },

  // Key Items (关键物品)
  BOOK: { id: 'item_book', name: '笔记本', description: '记录冒险的日志。', type: 'Key' as const, rarity: 'Common' as const, icon: IMAGES.icons.book },
  MAP: { id: 'item_map', name: '旧地图', description: '标注着附近区域的地图。', type: 'Key' as const, rarity: 'Common' as const, icon: IMAGES.icons.book },
  PHOENIX_FEATHER: { id: 'item_feather', name: '凤凰羽毛', description: '摸起来很暖和。传说可以复活倒下的同伴。', type: 'Material' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.wings },
  TREASURE_CHEST: { id: 'item_chest', name: '宝箱', description: '锁着的箱子，需要钥匙。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.trunk },
  KNIGHT_BADGE: { id: 'item_badge', name: '骑士徽章', description: '证明身份的信物。', type: 'Key' as const, rarity: 'Common' as const, icon: IMAGES.icons.knight },
  HOUSE_DEED: { id: 'item_deed', name: '房契', description: '一处小屋的所有权证明。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.house },
  EXPLORER_COMPASS: { id: 'item_compass', name: '寻路罗盘', description: '可记录探索路径的罗盘，适合野外行动。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.compass },
  ANCIENT_SCROLL: { id: 'item_scroll', name: '古代卷轴', description: '布满符文的卷轴，学者们的珍贵线索。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.scroll },

  // Quest/Enemy related (任务/敌人相关)
  GOBLIN_EAR: { id: 'item_goblin_ear', name: '哥布林耳朵', description: '讨伐任务的证明。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.goblin },
  CURSED_SKULL: { id: 'item_skull', name: '诅咒头骨', description: '散发着不祥气息的头骨。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.skull },
  FIRE_ESSENCE: { id: 'item_fire', name: '火焰精华', description: '炽热的元素结晶。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.fire },

  // Legendary Treasures (传奇宝物，仅商店售卖)
  RELIC_CTHULHU_IDOL: { id: 'relic_cthulhu_idol', name: '旧日支配者偶像', description: '邪神雕像，低语的波纹令人不寒而栗。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.cthulhuIdol },
  RELIC_DRAGON_FANG: { id: 'relic_dragon_fang', name: '上古龙牙', description: '锋利无比，仍残留灼热的气息。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.dragonFang },
  RELIC_DRAGON_SHIELD: { id: 'relic_dragon_shield', name: '龙鳞守护', description: '以巨龙鳞片制成的盾牌，闪烁金属光泽。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.dragonShield },
  RELIC_FLAME_SWORD: { id: 'relic_flame_sword', name: '烈焰大剑', description: '剑身缠绕火纹，似乎随时要燃烧起来。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.flameSword },
  RELIC_GENIE_LAMP: { id: 'relic_genie_lamp', name: '神灯', description: '沙漠的传说宝物，灯身泛着神秘金光。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.genieLamp },
  RELIC_HOLY_BRANCH: { id: 'relic_holy_branch', name: '圣树枝', description: '充满生命力的枝条，可驱散邪雾。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.holyBranch },
  RELIC_INFINITY_GAUNTLET: { id: 'relic_infinity_gauntlet', name: '无尽手套', description: '镶满宝石的神秘手套，掌控力量的象征。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.infinityGauntlet },
  RELIC_JEWELED_CROWN: { id: 'relic_jeweled_crown', name: '镶宝王冠', description: '王权的象征，宝石折射出耀眼光芒。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.jeweledCrown },
  RELIC_LEGENDARY_CHEST: { id: 'relic_legendary_chest', name: '传奇宝匣', description: '雕刻精美的宝箱，沉甸甸的不可估量。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.legendaryChest },
  RELIC_LIGHTNING_ORB: { id: 'relic_lightning_orb', name: '雷霆宝珠', description: '跳跃雷电的宝珠，噼啪作响。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.lightningOrb },
  RELIC_PHOENIX_FEATHER: { id: 'relic_phoenix_feather', name: '耀焰凤凰羽', description: '与神话相连的羽毛，触手温热。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.phoenixFeather2 },
  RELIC_RUNE_STONE: { id: 'relic_rune_stone', name: '至高符文石', description: '铭刻古代符文的石板，微光流转。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.runeStone },
  RELIC_SKULL_DAGGER: { id: 'relic_skull_dagger', name: '骸骨短刃', description: '阴冷的骨刃，刀锋透出诡异寒意。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.skullDagger },
  RELIC_SPELLBOOK: { id: 'relic_spellbook', name: '禁忌魔导书', description: '封面铆钉斑驳，记载失落的咒式。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.spellbook },
  RELIC_STAR_CRYSTAL: { id: 'relic_star_crystal', name: '星辉水晶', description: '蕴含星辰之力的结晶，闪烁冷蓝光。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.starCrystal },
  RELIC_WINGED_HOURGLASS: { id: 'relic_winged_hourglass', name: '翼时沙漏', description: '掌控流光的沙漏，银翼翩然。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.wingedHourglass },

  // 成就奖励
  OVERLORD_PROOF: { id: 'overlord_proof', name: '霸主之证', description: '集齐万宝阁所有传奇宝物后颁发的荣耀勋章。持有者被视为艾瑟瑞亚的传奇霸主。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.bg.valley },
} as const;

// 辅助函数：获取物品常量的副本（用于添加到背包）
// 重要：添加物品时必须使用此函数，确保每个物品有唯一ID
export function getItemInstance(itemKey: keyof typeof ALL_ITEMS, quantity?: number): Item {
  const template = ALL_ITEMS[itemKey];
  const item: Item = {
    ...template,
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  // 仅为消耗品设置数量
  if (template.type === 'Consumable') {
    item.quantity = quantity ?? 1;
  }

  return item;
}

// 职业初始物品配置 (物品key + 数量)
const STARTING_ITEMS_CONFIG: Record<ClassType, Array<{ key: keyof typeof ALL_ITEMS; qty?: number }>> = {
  [ClassType.ALCHEMIST]: [
    { key: 'POTION', qty: 3 },
    { key: 'ARCANE_TONIC', qty: 2 },
    { key: 'HERB_BUNDLE', qty: 3 },
    { key: 'BOOK' }
  ],
  [ClassType.KNIGHT]: [
    { key: 'SWORD' },
    { key: 'SHIELD' },
    { key: 'SWIFT_BOOTS' },
    { key: 'STAMINA_STEW', qty: 2 },
    { key: 'BREAD', qty: 3 }
  ],
  [ClassType.SKY_PIRATE]: [
    { key: 'HUNTER_CROSSBOW' },
    { key: 'REINFORCED_QUIVER' },
    { key: 'APPLE_SNACK', qty: 2 },
    { key: 'EXPLORER_COMPASS' },
    { key: 'GOLD_COIN' }
  ],
  [ClassType.SCHOLAR]: [
    { key: 'WAND' },
    { key: 'BOOK' },
    { key: 'ANCIENT_SCROLL' },
    { key: 'RUNE_FRAGMENT', qty: 2 },
    { key: 'STAR_CRYSTAL' },
    { key: 'ARCANE_TONIC', qty: 1 }
  ],
};

// 获取职业初始物品（返回物品实例，不是常量引用）
export function getStartingInventory(classType: ClassType): Item[] {
  return STARTING_ITEMS_CONFIG[classType].map(({ key, qty }) => getItemInstance(key, qty));
}

// === 任务常量库 (ALL_QUESTS) ===
// 所有任务都必须在这里预定义
export const ALL_QUESTS: Record<string, Omit<Quest, 'status'>> = {
  SLIME_HUNT: {
    id: 'quest_slime',
    title: '讨伐：变异史莱姆',
    description: '西边森林的史莱姆似乎受到了某种魔力的影响变得巨大化了，请前往讨伐。',
    reward: 500,
    type: 'COMBAT',
    rarity: 'Urgent',
  },
  HERB_GATHER: {
    id: 'quest_herb',
    title: '采集：月光草',
    description: '采集5株月光草交给药剂师。',
    reward: 200,
    type: 'GATHER',
    rarity: 'Common',
  },
  GOBLIN_PATROL: {
    id: 'quest_goblin',
    title: '巡逻：哥布林营地',
    description: '前往北方山谷调查哥布林的活动。',
    reward: 300,
    type: 'COMBAT',
    rarity: 'Common',
  },
  ANCIENT_RUINS: {
    id: 'quest_ruins',
    title: '探索：古代遗迹',
    description: '学者委托你探索遗迹深处，寻找古代文献。',
    reward: 800,
    type: 'EXPLORE',
    rarity: 'Rare',
  },
} as const;

// 传奇宝物商店配置
export const LEGENDARY_SHOP_PRICE = 1000;
export const LEGENDARY_SHOP_ITEMS: Array<keyof typeof ALL_ITEMS> = [
  'RELIC_CTHULHU_IDOL',
  'RELIC_DRAGON_FANG',
  'RELIC_DRAGON_SHIELD',
  'RELIC_FLAME_SWORD',
  'RELIC_GENIE_LAMP',
  'RELIC_HOLY_BRANCH',
  'RELIC_INFINITY_GAUNTLET',
  'RELIC_JEWELED_CROWN',
  'RELIC_LEGENDARY_CHEST',
  'RELIC_LIGHTNING_ORB',
  'RELIC_PHOENIX_FEATHER',
  'RELIC_RUNE_STONE',
  'RELIC_SKULL_DAGGER',
  'RELIC_SPELLBOOK',
  'RELIC_STAR_CRYSTAL',
  'RELIC_WINGED_HOURGLASS',
];

// 获取所有可用任务（未接受且未完成）
export function getAvailableQuests(activeQuestIds: string[], completedQuestIds: string[]): Quest[] {
  return Object.values(ALL_QUESTS)
    .filter(q => !activeQuestIds.includes(q.id) && !completedQuestIds.includes(q.id))
    .map(q => ({ ...q, status: 'available' as const }));
}

// 获取活跃任务
export function getActiveQuests(activeQuestIds: string[]): Quest[] {
  return activeQuestIds
    .map(id => Object.values(ALL_QUESTS).find(q => q.id === id))
    .filter((q): q is Omit<Quest, 'status'> => q !== undefined)
    .map(q => ({ ...q, status: 'active' as const }));
}

// 获取已完成任务
export function getCompletedQuests(completedQuestIds: string[]): Quest[] {
  return completedQuestIds
    .map(id => Object.values(ALL_QUESTS).find(q => q.id === id))
    .filter((q): q is Omit<Quest, 'status'> => q !== undefined)
    .map(q => ({ ...q, status: 'completed' as const }));
}

export const STARTING_LOGS = (name: string): any[] => [
  {
    speaker: '旁白',
    text: `清晨的阳光透过长老树的叶隙，斑驳地洒在地面上……\n${name}，你猛地醒了过来。今天是冒险开始的日子。\n「喂——！你要睡到什么时候呀？太阳都晒屁股啦！」青梅竹马在门外大喊。`,
    type: 'narration'
  },
];

// Consolidated list of all assets for preloading
export const ALL_ASSETS = [
  ...Object.values(IMAGES.bg),
  ...Object.values(IMAGES.char),
  ...Object.values(IMAGES.icons),
  // Generate all possible character portrait combinations
  ...Object.values(ClassType).flatMap(c => 
    ['Male', 'Female'].map(g => getCharacterImage(c, g))
  )
];

// 地图节点与连线（用于前端展示和跳转指令）
export const MAP_GRAPH = {
  nodes: [
    { id: 'capital', name: '王都阿斯拉 - 中央广场', desc: '王国心脏，冒险起点', row: 1, col: 2 },
    { id: 'market', name: '阿斯拉外环 - 集市街', desc: '热闹的贸易区', row: 2, col: 1 },
    { id: 'airship', name: '碧空港 - 飞艇码头', desc: '通往天空的港口', row: 2, col: 3 },
    { id: 'forest', name: '北境森林 - 迷雾小径', desc: '薄雾与精灵的领域', row: 3, col: 1 },
    { id: 'ruins', name: '古代遗迹 - 外环石门', desc: '沉睡的石门与符文', row: 3, col: 2 },
    { id: 'desert', name: '南方荒漠 - 绿洲商队', desc: '沙漠绿洲与商队', row: 3, col: 3 },
  ],
  edges: [
    ['capital', 'market'],
    ['capital', 'airship'],
    ['market', 'forest'],
    ['capital', 'ruins'],
    ['airship', 'desert'],
    ['forest', 'ruins'],
    ['ruins', 'desert'],
  ],
};

// 地图节点简称（用于节点图显示）
export const MAP_SHORT_NAMES: Record<string, string> = {
  capital: '王都',
  market: '集市',
  airship: '飞艇港',
  forest: '森林',
  ruins: '遗迹',
  desert: '荒漠',
};
