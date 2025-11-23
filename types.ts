
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

export interface Character {
  name: string;
  classType: ClassType;
  gender: 'Male' | 'Female' | 'Non-binary';
  stats: CharacterStats;
  level: number;
  gold: number;
  avatarUrl: string;
  appearance?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'Consumable' | 'Equipment' | 'Material' | 'Key';
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
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
