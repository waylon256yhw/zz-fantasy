import { CharacterStats, ClassType, Item, Quest } from "./types";

export const ASSET_BASE_URL = "https://pub-12f2a3bd170342c18c0c3de229cb60c7.r2.dev";
const ILLUSTRATION_ICON_PATH = `${ASSET_BASE_URL}/插画图标`;
const ENEMY_ILLUSTRATION_ICON_PATH = ILLUSTRATION_ICON_PATH;

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

    // 敌人 / 魔物 - 低级
    enemyGoblinScout: `${ENEMY_ILLUSTRATION_ICON_PATH}/01_goblin_scout.png`,
    enemyRoadBandit: `${ENEMY_ILLUSTRATION_ICON_PATH}/02_road_bandit.png`,
    enemyWildBoar: `${ENEMY_ILLUSTRATION_ICON_PATH}/03_wild_boar.png`,
    enemyYoungTreant: `${ENEMY_ILLUSTRATION_ICON_PATH}/04_young_treant.png`,
    enemyCaveBat: `${ENEMY_ILLUSTRATION_ICON_PATH}/05_cave_bat.png`,
    enemyBlueSlime: `${ENEMY_ILLUSTRATION_ICON_PATH}/06_blue_slime.png`,
    enemyBoneSoldier: `${ENEMY_ILLUSTRATION_ICON_PATH}/07_bone_soldier.png`,
    enemySewerRat: `${ENEMY_ILLUSTRATION_ICON_PATH}/08_sewer_rat.png`,
    enemyCaveSpider: `${ENEMY_ILLUSTRATION_ICON_PATH}/09_cave_spider.png`,
    enemyTrainingDummy: `${ENEMY_ILLUSTRATION_ICON_PATH}/10_training_dummy.png`,
    enemyStoneGolem: `${ENEMY_ILLUSTRATION_ICON_PATH}/11_stone_golem.png`,
    enemyImpDevil: `${ENEMY_ILLUSTRATION_ICON_PATH}/12_imp_devil.png`,
    enemyForestFairy: `${ENEMY_ILLUSTRATION_ICON_PATH}/13_forest_fairy.png`,
    enemyAngryShroom: `${ENEMY_ILLUSTRATION_ICON_PATH}/14_angry_shroom.png`,
    enemyBabyDrake: `${ENEMY_ILLUSTRATION_ICON_PATH}/15_baby_drake.png`,
    enemySoftGhost: `${ENEMY_ILLUSTRATION_ICON_PATH}/16_soft_ghost.png`,

    // 敌人 / 魔物 - 中级
    enemyFeralTiger: `${ENEMY_ILLUSTRATION_ICON_PATH}/01_feral_tiger.png`,
    enemyWerewolf: `${ENEMY_ILLUSTRATION_ICON_PATH}/02_werewolf.png`,
    enemySeaSerpent: `${ENEMY_ILLUSTRATION_ICON_PATH}/03_sea_serpent.png`,
    enemyVampireLord: `${ENEMY_ILLUSTRATION_ICON_PATH}/04_vampire_lord.png`,
    enemyMountedKnight: `${ENEMY_ILLUSTRATION_ICON_PATH}/05_mounted_knight.png`,
    enemyDarkVizier: `${ENEMY_ILLUSTRATION_ICON_PATH}/06_dark_vizier.png`,
    enemyProudGriffin: `${ENEMY_ILLUSTRATION_ICON_PATH}/07_proud_griffin.png`,
    enemyFrostOgre: `${ENEMY_ILLUSTRATION_ICON_PATH}/08_frost_ogre.png`,
    enemyFireDragon: `${ENEMY_ILLUSTRATION_ICON_PATH}/09_fire_dragon.png`,
    enemyDarkRanger: `${ENEMY_ILLUSTRATION_ICON_PATH}/10_dark_ranger.png`,
    enemyBoneGeneral: `${ENEMY_ILLUSTRATION_ICON_PATH}/11_bone_general.png`,
    enemySeaMedusa: `${ENEMY_ILLUSTRATION_ICON_PATH}/12_sea_medusa.png`,
    enemySpikedColossus: `${ENEMY_ILLUSTRATION_ICON_PATH}/13_spiked_colossus.png`,
    enemyHellKnight: `${ENEMY_ILLUSTRATION_ICON_PATH}/14_hell_knight.png`,
    enemyGoblinAirship: `${ENEMY_ILLUSTRATION_ICON_PATH}/15_goblin_airship.png`,
    enemyShadowNinja: `${ENEMY_ILLUSTRATION_ICON_PATH}/16_shadow_ninja.png`,

    // 敌人 / 魔物 - 高级BOSS / 稀有怪
    bossInfernoDragon: `${ENEMY_ILLUSTRATION_ICON_PATH}/01_inferno_dragon.png`,
    bossInfernalLord: `${ENEMY_ILLUSTRATION_ICON_PATH}/02_infernal_lord.png`,
    bossRuneColossus: `${ENEMY_ILLUSTRATION_ICON_PATH}/03_rune_colossus.png`,
    bossBlazePhoenix: `${ENEMY_ILLUSTRATION_ICON_PATH}/04_blaze_phoenix.png`,
    bossJewelBeetle: `${ENEMY_ILLUSTRATION_ICON_PATH}/05_jewel_beetle.png`,
    bossRoyalSlime: `${ENEMY_ILLUSTRATION_ICON_PATH}/06_royal_slime.png`,
    bossCursedChest: `${ENEMY_ILLUSTRATION_ICON_PATH}/07_cursed_chest.png`,
    bossStarlightFairy: `${ENEMY_ILLUSTRATION_ICON_PATH}/08_starlight_fairy.png`,
    bossDeathKnight: `${ENEMY_ILLUSTRATION_ICON_PATH}/09_death_knight.png`,
    bossCrystalGiant: `${ENEMY_ILLUSTRATION_ICON_PATH}/10_crystal_giant.png`,
    bossArcaneSage: `${ENEMY_ILLUSTRATION_ICON_PATH}/11_arcane_sage.png`,
    bossIronChampion: `${ENEMY_ILLUSTRATION_ICON_PATH}/12_iron_champion.png`,
    bossCosmosDragon: `${ENEMY_ILLUSTRATION_ICON_PATH}/13_cosmos_dragon.png`,
    bossRainbowAvatar: `${ENEMY_ILLUSTRATION_ICON_PATH}/14_rainbow_avatar.png`,
    bossRuneGargoyle: `${ENEMY_ILLUSTRATION_ICON_PATH}/15_rune_gargoyle.png`,
    bossVoidHorror: `${ENEMY_ILLUSTRATION_ICON_PATH}/16_void_horror.png`,
  }
};

// 敌人插画图标中文索引（按难度分组）
export const ENEMY_ILLUSTRATION_GROUPS = {
  low: {
    label: '低级魔物',
    list: [
      { key: 'enemyGoblinScout', name: '哥布林斥候' },
      { key: 'enemyRoadBandit', name: '路边强盗' },
      { key: 'enemyWildBoar', name: '野猪' },
      { key: 'enemyYoungTreant', name: '幼年树人' },
      { key: 'enemyCaveBat', name: '洞穴蝙蝠' },
      { key: 'enemyBlueSlime', name: '蓝色史莱姆' },
      { key: 'enemyBoneSoldier', name: '骸骨士兵' },
      { key: 'enemySewerRat', name: '下水道巨鼠' },
      { key: 'enemyCaveSpider', name: '洞穴蜘蛛' },
      { key: 'enemyTrainingDummy', name: '训练木桩' },
      { key: 'enemyStoneGolem', name: '石像傀儡' },
      { key: 'enemyImpDevil', name: '小恶魔' },
      { key: 'enemyForestFairy', name: '森林精灵' },
      { key: 'enemyAngryShroom', name: '愤怒蘑菇' },
      { key: 'enemyBabyDrake', name: '幼年飞龙' },
      { key: 'enemySoftGhost', name: '柔弱幽灵' },
    ],
  },
  mid: {
    label: '中级魔物',
    list: [
      { key: 'enemyFeralTiger', name: '野性猛虎' },
      { key: 'enemyWerewolf', name: '狼人' },
      { key: 'enemySeaSerpent', name: '海洋巨蛇' },
      { key: 'enemyVampireLord', name: '吸血领主' },
      { key: 'enemyMountedKnight', name: '骑乘骑士' },
      { key: 'enemyDarkVizier', name: '黑暗宰相' },
      { key: 'enemyProudGriffin', name: '傲翼狮鹫' },
      { key: 'enemyFrostOgre', name: '冰霜食人魔' },
      { key: 'enemyFireDragon', name: '火焰巨龙' },
      { key: 'enemyDarkRanger', name: '暗影游侠' },
      { key: 'enemyBoneGeneral', name: '白骨将军' },
      { key: 'enemySeaMedusa', name: '海妖美杜莎' },
      { key: 'enemySpikedColossus', name: '棘刺巨像' },
      { key: 'enemyHellKnight', name: '地狱骑士' },
      { key: 'enemyGoblinAirship', name: '哥布林飞艇' },
      { key: 'enemyShadowNinja', name: '影子忍者' },
    ],
  },
  high: {
    label: '高级BOSS/稀有怪',
    list: [
      { key: 'bossInfernoDragon', name: '炼狱巨龙' },
      { key: 'bossInfernalLord', name: '炼狱魔君' },
      { key: 'bossRuneColossus', name: '符文巨像' },
      { key: 'bossBlazePhoenix', name: '烈焰凤凰' },
      { key: 'bossJewelBeetle', name: '宝石甲虫' },
      { key: 'bossRoyalSlime', name: '皇家史莱姆' },
      { key: 'bossCursedChest', name: '诅咒宝箱' },
      { key: 'bossStarlightFairy', name: '星光精灵' },
      { key: 'bossDeathKnight', name: '死亡骑士' },
      { key: 'bossCrystalGiant', name: '水晶巨人' },
      { key: 'bossArcaneSage', name: '奥术贤者' },
      { key: 'bossIronChampion', name: '钢铁勇士' },
      { key: 'bossCosmosDragon', name: '宇宙巨龙' },
      { key: 'bossRainbowAvatar', name: '彩虹化身' },
      { key: 'bossRuneGargoyle', name: '符文石像鬼' },
      { key: 'bossVoidHorror', name: '虚空恐魔' },
    ],
  },
} as const;

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
  BREAD: { id: 'item_bread', name: '旅行干粮', description: '简单的面包，能果腹。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.bread },
  APPLE_SNACK: { id: 'item_apple', name: '苹果小食', description: '爽脆的补给，恢复少量生命。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.apple },
  STAMINA_STEW: { id: 'item_stew', name: '猎人炖汤', description: '热气腾腾，补充体力，恢复中量生命。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.stew },
  ARCANE_TONIC: { id: 'item_arcane_tonic', name: '秘药：灵能酿', description: '短时间内提升专注，恢复中量魔力。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.purplePotion },
  TAVERN_BEER: { id: 'item_beer', name: '酒馆麦酒', description: '泡沫丰富的麦芽啤酒，能稍微暖暖胃。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.beer },
  FOREST_BERRIES: { id: 'item_berries', name: '森林浆果碟', description: '酸酸甜甜的一小碟浆果，适合边听故事边吃。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.berries },
  SWEET_CAKE: { id: 'item_cake', name: '奶油小蛋糕', description: '裱花细致的蛋糕，让人一口气忘掉疲惫。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.cake },
  MORNING_CROISSANT: { id: 'item_croissant', name: '清晨牛角包', description: '刚出炉的黄油牛角包，层层酥脆。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.croissant },
  GRILLED_FISH: { id: 'item_fish', name: '炭烤鱼排', description: '外焦里嫩的鱼排，常见于港口小摊。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.fish },
  FRESH_JUICE: { id: 'item_juice', name: '鲜榨果汁', description: '色彩明亮的果汁，解渴又提神。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.juice },
  STREET_KEBAB: { id: 'item_kebab', name: '街边肉串', description: '带着炭火香气的肉串，是夜行冒险者最常点的宵夜。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.kebab },
  COUNTRY_LOAF: { id: 'item_loaf', name: '乡村大面包', description: '外壳略硬但越嚼越香，适合长途旅行时切片享用。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.loaf },
  ROAST_MEAT: { id: 'item_meat', name: '火烤肉盘', description: '分量十足的烤肉拼盘，很难一个人吃完。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.meat },
  HONEY_PANCAKES: { id: 'item_pancakes', name: '蜂蜜松饼塔', description: '淋上厚厚一层蜂蜜的松饼，高得有点危险。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.pancakes },
  APPLE_PIE: { id: 'item_pie', name: '苹果派', description: '据说不同酒馆的苹果派都有各自的秘密配方。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.pie },
  RAMEN_BOWL: { id: 'item_ramen', name: '热腾腾拉面', description: '汤头浓郁，适合跑了一整天任务之后。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.ramen },
  RICE_SET: { id: 'item_rice', name: '商人定食', description: '简单却分量十足的米饭套餐，常出现在商队驻扎地。', type: 'Consumable' as const, rarity: 'Common' as const, icon: IMAGES.icons.rice },
  SUSHI_PLATTER: { id: 'item_sushi', name: '寿司拼盘', description: '来自远洋的做法，在港口一带渐渐流行起来。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.sushi },
  FRUIT_TART: { id: 'item_tart', name: '季节水果挞', description: '摆盘精致的水果挞，是节庆时最抢手的甜点之一。', type: 'Consumable' as const, rarity: 'Rare' as const, icon: IMAGES.icons.tart },

  // Equipment (装备)
  SWORD: {
    id: 'item_sword',
    name: '制式长剑',
    description: '标准装备，保养良好。',
    type: 'Equipment' as const,
    rarity: 'Common' as const,
    icon: IMAGES.icons.sword,
    statBonus: { STR: 3, DEX: 1 },
  },
  SHIELD: {
    id: 'item_shield',
    name: '圆盾',
    description: '刻有纹章的盾牌。',
    type: 'Equipment' as const,
    rarity: 'Common' as const,
    icon: IMAGES.icons.shield,
    statBonus: { STR: 1, DEX: 1, LUCK: 1 },
  },
  WAND: {
    id: 'item_wand',
    name: '木杖',
    description: '简陋的法杖，聚焦魔力。',
    type: 'Equipment' as const,
    rarity: 'Common' as const,
    icon: IMAGES.icons.wand,
    statBonus: { INT: 3, CHA: 1 },
  },
  SWIFT_BOOTS: {
    id: 'item_swift_boots',
    name: '迅捷行军靴',
    description: '轻量靴子，行军与闪避更从容。',
    type: 'Equipment' as const,
    rarity: 'Rare' as const,
    icon: IMAGES.icons.boots,
    statBonus: { DEX: 3, LUCK: 1 },
  },
  HUNTER_CROSSBOW: {
    id: 'item_crossbow',
    name: '猎手弩',
    description: '便携的远程武器，常被空贼与侦查兵携带。',
    type: 'Equipment' as const,
    rarity: 'Rare' as const,
    icon: IMAGES.icons.crossbow,
    statBonus: { DEX: 2, STR: 1 },
  },
  REINFORCED_QUIVER: {
    id: 'item_quiver',
    name: '强化箭囊',
    description: '加固箭袋，增加携弹上限。',
    type: 'Equipment' as const,
    rarity: 'Common' as const,
    icon: IMAGES.icons.quiver,
    statBonus: { DEX: 1, LUCK: 1 },
  },

  // Materials (素材)
  GOLD_COIN: { id: 'item_gold', name: '金币×10', description: '通用货币。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.gold },
  SLIME_JELLY: { id: 'item_slime', name: '史莱姆果冻', description: '有弹性的凝胶，炼金素材。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.goblin },
  CRYSTAL: { id: 'item_crystal', name: '魔力结晶', description: '蕴含魔力的宝石。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.diamond },
  HERB_BUNDLE: { id: 'item_herbs', name: '药草包', description: '常见草药，基础炼金与疗伤素材。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.herbs },
  RUNE_FRAGMENT: { id: 'item_rune', name: '符文石碎片', description: '刻有微光符文的石片，可作为能量媒介。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.runeStone },
  STAR_CRYSTAL: { id: 'item_star_crystal', name: '星辰结晶', description: '闪烁的结晶，蕴含强大而稳定的能量。', type: 'Material' as const, rarity: 'Epic' as const, icon: IMAGES.icons.starCrystal },
  RIVER_STONES: { id: 'item_stones', name: '占卜河石', description: '被磨得圆润的鹅卵石，旅人喜欢拿来占卜运势。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.stones },

  // Key Items (关键物品)
  BOOK: { id: 'item_book', name: '笔记本', description: '记录冒险的日志。', type: 'Key' as const, rarity: 'Common' as const, icon: IMAGES.icons.book },
  MAP: { id: 'item_map', name: '旧地图', description: '标注着附近区域的地图。', type: 'Key' as const, rarity: 'Common' as const, icon: IMAGES.icons.book },
  PHOENIX_FEATHER: { id: 'item_feather', name: '凤凰羽毛', description: '摸起来很暖和。传说可以复活倒下的同伴。', type: 'Material' as const, rarity: 'Legendary' as const, icon: IMAGES.icons.wings },
  TREASURE_CHEST: { id: 'item_chest', name: '宝箱', description: '锁着的箱子，需要钥匙。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.trunk },
  KNIGHT_BADGE: { id: 'item_badge', name: '骑士徽章', description: '证明身份的信物。', type: 'Key' as const, rarity: 'Common' as const, icon: IMAGES.icons.knight },
  HOUSE_DEED: { id: 'item_deed', name: '房契', description: '一处小屋的所有权证明。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.house },
  EXPLORER_COMPASS: { id: 'item_compass', name: '寻路罗盘', description: '可记录探索路径的罗盘，适合野外行动。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.compass },
  ANCIENT_SCROLL: { id: 'item_scroll', name: '古代卷轴', description: '布满符文的卷轴，学者们的珍贵线索。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.scroll },
  GUILD_BANNER: { id: 'item_banner', name: '行会旗帜', description: '绣有行会纹章的旗帜，常在庆典或联赛中被高高举起。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.banner },
  TAVERN_GOBLET: { id: 'item_goblet', name: '刻纹酒杯', description: '底部刻着某家酒馆的名字，是少数人才有的“常客纪念品”。', type: 'Key' as const, rarity: 'Rare' as const, icon: IMAGES.icons.goblet },

  // Quest/Enemy related (任务/敌人相关)
  GOBLIN_EAR: { id: 'item_goblin_ear', name: '哥布林耳朵', description: '讨伐任务的证明。', type: 'Material' as const, rarity: 'Common' as const, icon: IMAGES.icons.goblin },
  CURSED_SKULL: { id: 'item_skull', name: '诅咒头骨', description: '散发着不祥气息的头骨。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.skull },
  FIRE_ESSENCE: { id: 'item_fire', name: '火焰精华', description: '炽热的元素结晶。', type: 'Material' as const, rarity: 'Rare' as const, icon: IMAGES.icons.fire },

  // Legendary Treasures (传奇宝物，仅商店售卖)
  RELIC_CTHULHU_IDOL: {
    id: 'relic_cthulhu_idol',
    name: '旧日支配者偶像',
    description: '邪神雕像，低语的波纹令人不寒而栗。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.cthulhuIdol,
    statBonus: { INT: 4, LUCK: 2, CHA: -2 },
  },
  RELIC_DRAGON_FANG: {
    id: 'relic_dragon_fang',
    name: '上古龙牙',
    description: '锋利无比，仍残留灼热的气息。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.dragonFang,
    statBonus: { STR: 5, DEX: 1, CHA: -1 },
  },
  RELIC_DRAGON_SHIELD: {
    id: 'relic_dragon_shield',
    name: '龙鳞守护',
    description: '以巨龙鳞片制成的盾牌，闪烁金属光泽。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.dragonShield,
    statBonus: { STR: 2, DEX: -1, CHA: 2, LUCK: 1 },
  },
  RELIC_FLAME_SWORD: {
    id: 'relic_flame_sword',
    name: '烈焰大剑',
    description: '剑身缠绕火纹，似乎随时要燃烧起来。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.flameSword,
    statBonus: { STR: 4, DEX: 2, CHA: -2 },
  },
  RELIC_GENIE_LAMP: {
    id: 'relic_genie_lamp',
    name: '神灯',
    description: '沙漠的传说宝物，灯身泛着神秘金光。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.genieLamp,
    statBonus: { LUCK: 4, CHA: 2, INT: 1 },
  },
  RELIC_HOLY_BRANCH: {
    id: 'relic_holy_branch',
    name: '圣树枝',
    description: '充满生命力的枝条，可驱散邪雾。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.holyBranch,
    statBonus: { INT: 2, CHA: 3, LUCK: 1 },
  },
  RELIC_INFINITY_GAUNTLET: {
    id: 'relic_infinity_gauntlet',
    name: '无尽手套',
    description: '镶满宝石的神秘手套，掌控力量的象征。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.infinityGauntlet,
    statBonus: { STR: 3, INT: 3, CHA: -2, LUCK: -1 },
  },
  RELIC_JEWELED_CROWN: {
    id: 'relic_jeweled_crown',
    name: '镶宝王冠',
    description: '王权的象征，宝石折射出耀眼光芒。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.jeweledCrown,
    statBonus: { CHA: 4, LUCK: 2 },
  },
  RELIC_LEGENDARY_CHEST: {
    id: 'relic_legendary_chest',
    name: '传奇宝匣',
    description: '雕刻精美的宝箱，沉甸甸的不可估量。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.legendaryChest,
    statBonus: { CHA: 1, LUCK: 3 },
  },
  RELIC_LIGHTNING_ORB: {
    id: 'relic_lightning_orb',
    name: '雷霆宝珠',
    description: '跳跃雷电的宝珠，噼啪作响。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.lightningOrb,
    statBonus: { DEX: 3, INT: 2, STR: -1 },
  },
  RELIC_PHOENIX_FEATHER: {
    id: 'relic_phoenix_feather',
    name: '耀焰凤凰羽',
    description: '与神话相连的羽毛，触手温热。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.phoenixFeather2,
    statBonus: { LUCK: 4, CHA: 1 },
  },
  RELIC_RUNE_STONE: {
    id: 'relic_rune_stone',
    name: '至高符文石',
    description: '铭刻古代符文的石板，微光流转。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.runeStone,
    statBonus: { INT: 4, LUCK: 1 },
  },
  RELIC_SKULL_DAGGER: {
    id: 'relic_skull_dagger',
    name: '骸骨短刃',
    description: '阴冷的骨刃，刀锋透出诡异寒意。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.skullDagger,
    statBonus: { DEX: 4, STR: 1, CHA: -2 },
  },
  RELIC_SPELLBOOK: {
    id: 'relic_spellbook',
    name: '禁忌魔导书',
    description: '封面铆钉斑驳，记载失落的咒式。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.spellbook,
    statBonus: { INT: 4, CHA: 1 },
  },
  RELIC_STAR_CRYSTAL: {
    id: 'relic_star_crystal',
    name: '星辉水晶',
    description: '蕴含星辰之力的结晶，闪烁冷蓝光。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.starCrystal,
    statBonus: { STR: 1, DEX: 1, INT: 1, CHA: 1, LUCK: 1 },
  },
  RELIC_WINGED_HOURGLASS: {
    id: 'relic_winged_hourglass',
    name: '翼时沙漏',
    description: '掌控流光的沙漏，银翼翩然。',
    type: 'Key' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.wingedHourglass,
    statBonus: { DEX: 2, INT: 1, LUCK: 2 },
  },

  // 成就奖励
  OVERLORD_PROOF: { id: 'overlord_proof', name: '霸主之证', description: '集齐万宝阁所有传奇宝物后颁发的荣耀勋章。持有者被视为艾瑟瑞亚的传奇霸主。', type: 'Key' as const, rarity: 'Legendary' as const, icon: IMAGES.bg.valley },
} as const;

// 万宝阁常驻补给（战斗用药水）
export const SHOP_POTION_ITEMS: Array<{ key: keyof typeof ALL_ITEMS; price: number }> = [
  { key: 'POTION', price: 200 },
  { key: 'ARCANE_TONIC', price: 200 },
];

// 酒馆餐厅菜单（售卖所有食物与饮品类消耗品）
export const RESTAURANT_ITEMS: Array<{ key: keyof typeof ALL_ITEMS; price: number }> = [
  { key: 'BREAD', price: 30 },
  { key: 'APPLE_SNACK', price: 25 },
  { key: 'STAMINA_STEW', price: 70 },
  { key: 'TAVERN_BEER', price: 40 },
  { key: 'FOREST_BERRIES', price: 35 },
  { key: 'SWEET_CAKE', price: 60 },
  { key: 'MORNING_CROISSANT', price: 35 },
  { key: 'GRILLED_FISH', price: 55 },
  { key: 'FRESH_JUICE', price: 30 },
  { key: 'STREET_KEBAB', price: 45 },
  { key: 'COUNTRY_LOAF', price: 50 },
  { key: 'ROAST_MEAT', price: 85 },
  { key: 'HONEY_PANCAKES', price: 65 },
  { key: 'APPLE_PIE', price: 50 },
  { key: 'RAMEN_BOWL', price: 70 },
  { key: 'RICE_SET', price: 60 },
  { key: 'SUSHI_PLATTER', price: 90 },
  { key: 'FRUIT_TART', price: 65 },
];

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
    const baseQty = quantity ?? 1;
    item.quantity = clampStack(baseQty);
  }

  return item;
}

// 职业初始物品配置 (物品key + 数量)
const STARTING_ITEMS_CONFIG: Record<ClassType, Array<{ key: keyof typeof ALL_ITEMS; qty?: number }>> = {
  [ClassType.ALCHEMIST]: [
    { key: 'POTION', qty: 4 },
    { key: 'ARCANE_TONIC', qty: 3 },
    { key: 'HERB_BUNDLE', qty: 3 },
    { key: 'FOREST_BERRIES', qty: 1 },
    { key: 'FRUIT_TART', qty: 1 },
    { key: 'BOOK' }
  ],
  [ClassType.KNIGHT]: [
    { key: 'SWORD' },
    { key: 'SHIELD' },
    { key: 'SWIFT_BOOTS' },
    { key: 'POTION', qty: 3 },
    { key: 'ARCANE_TONIC', qty: 1 },
    { key: 'STAMINA_STEW', qty: 2 },
    { key: 'BREAD', qty: 2 },
    { key: 'ROAST_MEAT', qty: 1 },
    { key: 'TAVERN_BEER', qty: 1 }
  ],
  [ClassType.SKY_PIRATE]: [
    { key: 'HUNTER_CROSSBOW' },
    { key: 'REINFORCED_QUIVER' },
    { key: 'POTION', qty: 1 },
    { key: 'ARCANE_TONIC', qty: 2 },
    { key: 'APPLE_SNACK', qty: 2 },
    { key: 'GRILLED_FISH', qty: 1 },
    { key: 'SUSHI_PLATTER', qty: 1 },
    { key: 'EXPLORER_COMPASS' },
    { key: 'GOLD_COIN' }
  ],
  [ClassType.SCHOLAR]: [
    { key: 'WAND' },
    { key: 'BOOK' },
    { key: 'ANCIENT_SCROLL' },
    { key: 'POTION', qty: 1 },
    { key: 'ARCANE_TONIC', qty: 2 },
    { key: 'RUNE_FRAGMENT', qty: 2 },
    { key: 'STAR_CRYSTAL' },
    { key: 'RAMEN_BOWL', qty: 1 },
    { key: 'HONEY_PANCAKES', qty: 1 },
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

// 全局金币与堆叠上限
export const MAX_GOLD = 100000;
export const MAX_STACK = 99;

export function clampGold(value: number): number {
  if (value < 0) return 0;
  if (value > MAX_GOLD) return MAX_GOLD;
  return value;
}

export function clampStack(quantity: number): number {
  if (quantity < 1) return 1;
  if (quantity > MAX_STACK) return MAX_STACK;
  return quantity;
}

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
