
export enum ClassType {
  ALCHEMIST = 'Alchemist',
  KNIGHT = 'Knight',
  SKY_PIRATE = 'Sky Pirate',
  SCHOLAR = 'Scholar'
}

export interface CharacterStats {
  STR: number;
  DEX: number;
  INT: number;
  CHA: number;
  LUCK: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number; // Gold reward
  type: 'COMBAT' | 'GATHER' | 'EXPLORE';
  rarity: 'Common' | 'Rare' | 'Urgent';
  status: 'available' | 'active' | 'completed';
}

export interface Character {
  name: string;
  classType: ClassType;
  gender: 'Male' | 'Female' | 'Non-binary';
  stats: CharacterStats;
  level: number;
  exp: number; // Current experience points
  gold: number;
  avatarUrl: string;
  appearance?: string;
  inventory: Item[];
  activeQuests: string[]; // Quest IDs
  completedQuests: string[]; // Quest IDs

  // HP/MP system (decorative with micro-fluctuation)
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'Consumable' | 'Equipment' | 'Material' | 'Key';
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  quantity?: number; // 仅用于消耗品（Consumable），其他类型忽略
}

export interface LogEntry {
  id: string;
  speaker: string;
  text: string;
  type: 'dialogue' | 'narration' | 'system';
}

export interface GameState {
  character: Character | null;
  inventory: Item[];
  logs: LogEntry[];
  location: string;
  setCharacter: (char: Character) => void;
  addLog: (entry: Omit<LogEntry, 'id'>) => void;
  addItem: (item: Item) => void;
}
