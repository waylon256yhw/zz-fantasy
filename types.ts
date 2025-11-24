
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

  // Combat system (Action Points)
  currentAP: number;
  maxAP: number;
  statsBonus: CharacterStats; // Equipment/relic bonuses (reserved for future)
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

// ========== Combat System Types ==========

export interface Enemy {
  id: string;
  name: string;
  level: number;
  rank: 'D' | 'C' | 'B' | 'A';
  currentHp: number;
  maxHp: number;
  attack: number; // Amount of AP damage to player
  defense: number;
  isTreasureMonster: boolean;
  rewards: {
    gold: number;
    exp: number;
    items?: string[]; // Item names from ALL_ITEMS
  };
}

export interface CombatLog {
  id: string;
  turn: number;
  text: string;
  type: 'action' | 'damage' | 'victory' | 'defeat' | 'system' | 'warning';
}

export interface CombatResult {
  enemy: Enemy;
  outcome: 'victory' | 'defeat' | 'retreat';
  turnsUsed: number;
  rewards: {
    gold: number;
    exp: number;
    items: string[];
  };
  playerStats: {
    damageDealt: number;
    damageTaken: number;
    apUsed: number;
  };
  failureReason?: string; // Optional: reason for defeat/retreat
}

export interface CombatState {
  isInCombat: boolean;
  currentEnemy: Enemy | null;
  combatLogs: CombatLog[];
  currentTurn: number;
  maxTurns: number;
  isPlayerStunned: boolean; // Player cannot act when stunned
  enemyNextAction: 'NORMAL' | 'STRONG'; // Enemy's next attack type
  apRegenBuffTurnsRemaining: number; // 治愈药水剩余生效回合数
  // Settlement phase
  showSettlement: boolean; // Show settlement screen after combat ends
  currentResult: CombatResult | null; // Current battle result
  sessionResults: CombatResult[]; // All battles in current session
}
