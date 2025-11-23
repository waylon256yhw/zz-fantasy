import { CharacterStats, ClassType, Item } from "./types";

export const ASSET_BASE_URL = "https://pub-12f2a3bd170342c18c0c3de229cb60c7.r2.dev";

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
    book: `${ASSET_BASE_URL}/插画图标/book.png`,
    diamond: `${ASSET_BASE_URL}/插画图标/diamond.png`,
    fight: `${ASSET_BASE_URL}/插画图标/fight.png`,
    fire: `${ASSET_BASE_URL}/插画图标/fire.png`,
    goblin: `${ASSET_BASE_URL}/插画图标/goblin.png`,
    gold: `${ASSET_BASE_URL}/插画图标/gold.png`,
    house: `${ASSET_BASE_URL}/插画图标/house.png`,
    knight: `${ASSET_BASE_URL}/插画图标/knight.png`,
    potion: `${ASSET_BASE_URL}/插画图标/potion.png`,
    shield: `${ASSET_BASE_URL}/插画图标/shield.png`,
    skull: `${ASSET_BASE_URL}/插画图标/skull.png`,
    sword: `${ASSET_BASE_URL}/插画图标/sword.png`,
    treasure: `${ASSET_BASE_URL}/插画图标/treasure.png`,
    trunk: `${ASSET_BASE_URL}/插画图标/trunk.png`,
    wand: `${ASSET_BASE_URL}/插画图标/wand.png`,
    wings: `${ASSET_BASE_URL}/插画图标/wings.png`,
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

export const MOCK_ITEMS: Item[] = [
  { id: '1', name: '治愈药水', description: '恢复50点生命值。尝起来像樱桃味。', type: 'Consumable', rarity: 'Common', icon: IMAGES.icons.potion },
  { id: '2', name: '魔力结晶', description: '恢复30点魔力。由于某种原因在微微震动。', type: 'Consumable', rarity: 'Rare', icon: IMAGES.icons.diamond },
  { id: '3', name: '旧地图', description: '周围山谷的地图。有一部分被撕掉了。', type: 'Key', rarity: 'Common', icon: IMAGES.icons.book },
  { id: '4', name: '生锈的匕首', description: '总比没有好。', type: 'Equipment', rarity: 'Common', icon: IMAGES.icons.sword },
  { id: '5', name: '凤凰羽毛', description: '摸起来很暖和。传说可以复活倒下的同伴。', type: 'Material', rarity: 'Legendary', icon: IMAGES.icons.wings },
  { id: '6', name: '新鲜面包', description: '刚出炉的，香气扑鼻。', type: 'Consumable', rarity: 'Common', icon: IMAGES.icons.treasure },
  { id: '7', name: '噗尼果冻', description: '某种史莱姆掉落的凝胶，很有弹性。', type: 'Material', rarity: 'Common', icon: IMAGES.icons.gold },
];

export const STARTING_LOGS = (name: string): any[] => [
  { speaker: '旁白', text: '清晨的阳光透过长老树的叶隙，斑驳地洒在地面上……', type: 'narration' },
  { speaker: '旁白', text: `${name}，你猛地醒了过来。今天是冒险开始的日子。`, type: 'narration' },
  { speaker: '青梅竹马', text: '喂——！你要睡到什么时候呀？太阳都晒屁股啦！', type: 'dialogue' },
];