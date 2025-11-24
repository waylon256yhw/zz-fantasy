/**
 * Game Context - Centralized State Management
 *
 * Manages global game state including:
 * - Character data
 * - Conversation logs
 * - DZMM API readiness
 * - Save/Load functionality
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Character, LogEntry, Item, CombatState, Enemy, CombatResult, CombatLog } from '../../types';
import { DZMMService } from '../services/dzmmService';
import { initializeHpMp, refreshHpMp } from '../utils/hpMpSystem';
import { LEGENDARY_SHOP_ITEMS, LEGENDARY_SHOP_PRICE, getItemInstance, ALL_ITEMS, clampGold, MAX_STACK } from '../../constants';
import { encounterRandomEnemy } from '../utils/enemySystem';
import {
  initCombatState,
  executePlayerAttack,
  executePlayerDefend,
  handleStunnedTurn,
  attemptRetreat,
  generateCombatResultPrompt,
} from '../utils/combatEngine';
import {
  consumeAP,
  recoverAP,
  recoverAPFromFood,
  willEnemyUseStrongAttack,
  calculateMaxAP,
  calculateAPDamage,
  checkTimeout,
  computeStatsBonusFromInventory,
} from '../utils/combatSystem';
import { COMBAT_CONFIG } from '../config/combatConfig';

interface GameContextType {
  // State
  character: Character | null;
  logs: LogEntry[];
  location: string;
  isDzmmReady: boolean;
  currentOpening: string; // For multi-opening system
  selectedModel: string; // DZMM AI model selection
  shopState: ShopState;
  lastSaveTimestamp: number; // Track last save time
  combatState: CombatState; // Combat system state
  devForceTreasureMonster: boolean; // DEV: 遭遇战必定触发珍宝怪

  // Setters
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setLocation: (loc: string) => void;
  setCurrentOpening: (opening: string) => void;
  setSelectedModel: (model: string) => void;
  refreshShop: (force?: boolean) => void;
  purchaseShopItem: () => boolean;
  claimOverlordProof: () => boolean;
  setDevForceTreasureMonster: (value: boolean) => void;

  // Helper functions
  addLog: (entry: Omit<LogEntry, 'id'>) => void;
  clearLogs: () => void;
  resetGameState: () => void; // Clear all game state for new game
  hasUnsavedChanges: () => boolean; // Check if there are unsaved changes

  // Inventory management
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  useItem: (itemId: string) => void; // 使用消耗品（数量-1，为0时移除）

  // Quest management
  acceptQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;

  // Combat management
  startCombat: () => void; // Start random encounter
  executeCombatAction: (action: 'attack' | 'defend' | 'skip' | 'useHealPotion' | 'useArcaneTonic') => void;
  handleRetreat: () => void;
  processCombatTurn: () => void; // Process turn when stunned
  continueEncounter: () => void; // Continue to next battle
  returnToAdventure: () => void; // End combat session and return

  // Save/Load
  saveGame: (slotNumber: number) => Promise<void>;
  loadGame: (slotNumber: number) => Promise<boolean>;
  getSavePreview: (slotNumber: number) => Promise<SavePreview | null>;
  autoSave: () => Promise<void>; // Auto-save to slot 0
}

export interface SavePreview {
  characterName: string;
  level: number;
  gold: number;
  exp: number;
  location: string;
  timestamp: string;
  messageCount: number;
  avatarUrl: string;
  classType: string;
  questsCompleted: number;
  questsActive: number;
  legendaryPurchased: number;
}

interface SaveData {
  version: string;
  character: Character;
  logs: LogEntry[];
  location: string;
  timestamp: number;
  opening: string;
  shopState?: ShopState;
  // Combat state: only save AP values, not active combat
  combatAP?: {
    currentAP: number;
    maxAP: number;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const SAVE_KEY_PREFIX = 'aetheria_save_slot_';
const SAVE_VERSION = '1.0.0';
const SHOP_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

export interface ShopState {
  currentItemKey: (typeof LEGENDARY_SHOP_ITEMS)[number] | null;
  nextRefreshAt: number;
  purchasedKeys: string[];
  achievementClaimed: boolean;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [location, setLocation] = useState<string>('王都阿斯拉 - 中央广场');
  const [isDzmmReady, setIsDzmmReady] = useState(false);
  const [currentOpening, setCurrentOpening] = useState<string>('main');
  const [selectedModel, setSelectedModel] = useState<string>('nalang-max-0826'); // Default to Max model
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState<number>(0);
  const [lastSaveLogsCount, setLastSaveLogsCount] = useState<number>(0);
  const [shopState, setShopState] = useState<ShopState>(() => ({
    currentItemKey: null,
    nextRefreshAt: Date.now(),
    purchasedKeys: [],
    achievementClaimed: false,
  }));
  const [devForceTreasureMonster, setDevForceTreasureMonster] = useState<boolean>(false);
  const [combatState, setCombatState] = useState<CombatState>({
    isInCombat: false,
    currentEnemy: null,
    combatLogs: [],
    currentTurn: 0,
    maxTurns: 10,
    isPlayerStunned: false,
    enemyNextAction: 'NORMAL',
    apRegenBuffTurnsRemaining: 0,
    showSettlement: false,
    currentResult: null,
    sessionResults: [],
  });

  // Helper: compute total stats bonus from inventory items and owned legendary relics
  const computeTotalStatsBonus = (inventory: Item[]): CharacterStats => {
    const fromInventory = computeStatsBonusFromInventory(inventory);

    // Legendary relics owned via 万宝阁（不一定出现在背包中）
    const fromRelics = shopState.purchasedKeys.reduce<CharacterStats>(
      (acc, key) => {
        const def = ALL_ITEMS[key];
        const bonus = def?.statBonus;
        if (!bonus) return acc;

        return {
          STR: acc.STR + (bonus.STR ?? 0),
          DEX: acc.DEX + (bonus.DEX ?? 0),
          INT: acc.INT + (bonus.INT ?? 0),
          CHA: acc.CHA + (bonus.CHA ?? 0),
          LUCK: acc.LUCK + (bonus.LUCK ?? 0),
        };
      },
      { STR: 0, DEX: 0, INT: 0, CHA: 0, LUCK: 0 }
    );

    return {
      STR: fromInventory.STR + fromRelics.STR,
      DEX: fromInventory.DEX + fromRelics.DEX,
      INT: fromInventory.INT + fromRelics.INT,
      CHA: fromInventory.CHA + fromRelics.CHA,
      LUCK: fromInventory.LUCK + fromRelics.LUCK,
    };
  };

  // Recompute stats bonus whenever legendary collection changes
  useEffect(() => {
    setCharacter(prev =>
      prev
        ? {
            ...prev,
            statsBonus: computeTotalStatsBonus(prev.inventory),
          }
        : prev
    );
  }, [shopState.purchasedKeys]);

  // Initialize DZMM API
  useEffect(() => {
    DZMMService.waitForReady().then(() => {
      setIsDzmmReady(true);
      console.log('[GameContext] DZMM API is ready');
    });
  }, []);

  // Refresh shop on mount
  useEffect(() => {
    refreshShop();
  }, []);

  // AP Recovery: recover AP after each dialogue (non-combat)
  useEffect(() => {
    if (!character || combatState.isInCombat) return;

    // Only recover if logs increased (new dialogue happened)
    if (logs.length > 0) {
      setCharacter(prev => {
        if (!prev) return prev;
        const newAP = recoverAP(prev.currentAP, prev.maxAP);
        if (newAP !== prev.currentAP) {
          return { ...prev, currentAP: newAP };
        }
        return prev;
      });
    }
  }, [logs.length, combatState.isInCombat]);

  // Add log entry with auto-generated ID
  const addLog = (entry: Omit<LogEntry, 'id'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Refresh shop rotation (hourly)
  const refreshShop = (force = false) => {
    setShopState(prev => {
      const now = Date.now();
      const allSoldOut = prev.purchasedKeys.length >= LEGENDARY_SHOP_ITEMS.length;
      const shouldRefresh = force || now >= prev.nextRefreshAt;

      if (!shouldRefresh || allSoldOut) {
        return prev;
      }

      // Build available pool excluding purchased
      const pool = LEGENDARY_SHOP_ITEMS.filter(key => !prev.purchasedKeys.includes(key));
      const nextItem = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;

      return {
        ...prev,
        currentItemKey: nextItem,
        nextRefreshAt: now + SHOP_REFRESH_INTERVAL,
      };
    });
  };

  // Purchase current shop item (returns success)
  const purchaseShopItem = (): boolean => {
    if (!character || !shopState.currentItemKey) return false;
    const templateKey = shopState.currentItemKey;

    if (character.gold < LEGENDARY_SHOP_PRICE) {
      return false;
    }

    // 扣除金币，仅点亮荣誉墙，不进入背包
    setCharacter(prev => prev ? { ...prev, gold: clampGold(prev.gold - LEGENDARY_SHOP_PRICE) } : prev);

    setShopState(prev => ({
      ...prev,
      purchasedKeys: [...prev.purchasedKeys, templateKey],
      currentItemKey: null,
      achievementClaimed: prev.achievementClaimed,
    }));

    return true;
  };

  // Claim overlord proof after full collection
  const claimOverlordProof = (): boolean => {
    if (!character) return false;
    const allCollected = shopState.purchasedKeys.length >= LEGENDARY_SHOP_ITEMS.length;
    if (!allCollected || shopState.achievementClaimed) return false;

    const proof = getItemInstance('OVERLORD_PROOF');
    setCharacter(prev =>
      prev
        ? {
            ...prev,
            inventory: [...prev.inventory, proof],
            statsBonus: computeTotalStatsBonus([...prev.inventory, proof]),
          }
        : prev
    );
    setShopState(prev => ({ ...prev, achievementClaimed: true }));
    return true;
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Reset all game state (for starting new game)
  const resetGameState = () => {
    setCharacter(null);
    setLogs([]);
    setLocation('王都阿斯拉 - 中央广场');
    setCurrentOpening('main');
    setLastSaveTimestamp(0);
    setLastSaveLogsCount(0);
    setShopState({
      currentItemKey: null,
      nextRefreshAt: Date.now(),
      purchasedKeys: [],
      achievementClaimed: false,
    });
    setCombatState({
      isInCombat: false,
      currentEnemy: null,
      combatLogs: [],
      currentTurn: 0,
      maxTurns: 10,
      isPlayerStunned: false,
      enemyNextAction: 'NORMAL',
      apRegenBuffTurnsRemaining: 0,
      showSettlement: false,
      currentResult: null,
      sessionResults: [],
    });
    console.log('[GameContext] Game state reset');
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (!character) return false;

    // If never saved, and has character, then unsaved
    if (lastSaveTimestamp === 0 && character) return true;

    // If new logs were added after last save
    return logs.length > lastSaveLogsCount;
  };

  // Add item to inventory
  const addItem = (item: Item) => {
    setCharacter(prev => {
      if (!prev) return prev;

      // 消耗品尝试堆叠（按名称），单格上限 99，不产生同名新格
      if (item.type === 'Consumable') {
        const existingIndex = prev.inventory.findIndex(
          i => i.type === 'Consumable' && i.name === item.name
        );

        const incomingQty = item.quantity ?? 1;

        if (existingIndex !== -1) {
          const inventory = [...prev.inventory];
          const existing = inventory[existingIndex];
          const currentQty = existing.quantity ?? 1;
          const spaceLeft = MAX_STACK - currentQty;

          if (spaceLeft <= 0) {
            // 已满格，直接丢弃新数量，不新建同名格子
            return prev;
          }

          const addQty = Math.min(spaceLeft, incomingQty);
          inventory[existingIndex] = {
            ...existing,
            quantity: currentQty + addQty,
          };

          return {
            ...prev,
            inventory,
            statsBonus: computeTotalStatsBonus(inventory),
          };
        }

        // 如果没有同名消耗品，则新增格子（自身数量也限制在上限内）
        const clampedItem: Item = {
          ...item,
          quantity: Math.min(incomingQty, MAX_STACK),
        };
        const inventory = [...prev.inventory, clampedItem];

        return {
          ...prev,
          inventory,
          statsBonus: computeTotalStatsBonus(inventory),
        };
      }

      // 非消耗品：直接新增格子
      const inventory = [...prev.inventory, item];
      return {
        ...prev,
        inventory,
        statsBonus: computeTotalStatsBonus(inventory),
      };
    });
  };

  // Remove item from inventory
  const removeItem = (itemId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const inventory = prev.inventory.filter((i) => i.id !== itemId);
      return {
        ...prev,
        inventory,
        statsBonus: computeTotalStatsBonus(inventory),
      };
    });
  };

  // Use consumable item (quantity - 1, remove if 0)
  const useItem = (itemId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;

      // Find the item being used
      const usedItem = prev.inventory.find(item => item.id === itemId);

      const updatedInventory = prev.inventory.map(item => {
        if (item.id === itemId && item.type === 'Consumable' && item.quantity) {
          const newQuantity = item.quantity - 1;
          // If quantity reaches 0, will be filtered out below
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => {
        // Remove items with quantity 0
        if (item.type === 'Consumable' && item.quantity !== undefined) {
          return item.quantity > 0;
        }
        return true;
      });

      // AP recovery from food
      let updatedAP = prev.currentAP;
      if (usedItem && usedItem.type === 'Consumable') {
        // Get item price from constants (match by item name)
        const foodPrices: Record<string, number> = {
          '苹果小食': 25, '新鲜果汁': 30, '面包': 30,
          '森林浆果': 35, '晨间羊角面包': 35,
          '酒馆麦酒': 40, '苹果派': 50,
          '烤鱼': 55, '甜蛋糕': 60,
          '蜂蜜煎饼': 65, '猎人炖汤': 70,
        };

        const price = foodPrices[usedItem.name];
        if (price !== undefined) {
          // This is food, recover AP
          updatedAP = recoverAPFromFood(prev.currentAP, prev.maxAP, price);
        }
      }

      return {
        ...prev,
        inventory: updatedInventory,
        currentAP: updatedAP,
        statsBonus: computeTotalStatsBonus(updatedInventory),
      };
    });
  };

  // Accept quest (add to active quests)
  const acceptQuest = (questId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      if (prev.activeQuests.includes(questId)) return prev; // Already accepted
      return {
        ...prev,
        activeQuests: [...prev.activeQuests, questId],
      };
    });
  };

  // Complete quest (move to completed, add reward)
  const completeQuest = (questId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      if (!prev.activeQuests.includes(questId)) return prev; // Not active
      return {
        ...prev,
        activeQuests: prev.activeQuests.filter((id) => id !== questId),
        completedQuests: [...prev.completedQuests, questId],
      };
    });
  };

  // ========== Combat Management ==========

  // Start combat encounter
  const startCombat = () => {
    if (!character) return;

    // 消耗一次遭遇战 AP（使用最新角色状态）
    setCharacter(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentAP: consumeAP(prev.currentAP, 'encounter'),
      };
    });

    // 生成新敌人（支持 DEV 强制珍宝怪）
    const enemy = encounterRandomEnemy(character.level, location, devForceTreasureMonster);

    // 初始化战斗状态：重置回合数等
    // 如果之前不在战斗中（showSettlement=false且isInCombat=false），清空sessionResults
    // 如果是从结算界面点击"继续战斗"，则保留sessionResults
    setCombatState(prev => {
      const base = initCombatState(enemy);
      const shouldPreserveSession = prev.showSettlement || prev.isInCombat;
      return {
        ...base,
        sessionResults: shouldPreserveSession ? prev.sessionResults : [],
      };
    });
  };

  /**
   * Helper: advance turn or end combat due to timeout
   * - 统一在 nextTurn 维度判定是否超出回合上限
   * - 负责追加 timeout 日志并调用 endCombat
   * - 若未超时，则交给 onContinue 回调更新 combatState
   */
  const handleTurnAdvanceOrTimeout = (
    enemy: Enemy,
    logs: CombatLog[],
    onContinue: (filteredLogs: CombatLog[], nextTurn: number) => void
  ) => {
    const nextTurn = combatState.currentTurn + 1;
    const safeLogs = Array.isArray(logs) ? logs : [];
    const validLogs = safeLogs.filter(log => !!log) as CombatLog[];

    if (checkTimeout(nextTurn, combatState.maxTurns)) {
      const timeoutLogs: CombatLog[] = [
        ...validLogs,
        {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          turn: nextTurn,
          text: `回合用尽，${enemy.isTreasureMonster ? '珍宝怪逃走了' : '敌人逃走了'}...`,
          type: 'system' as const,
        },
      ];
      endCombat('timeout', enemy, timeoutLogs);
      return;
    }

    onContinue(validLogs, nextTurn);
  };

  // Execute combat action (attack, defend, use potion, or skip when stunned)
  const executeCombatAction = (
    action: 'attack' | 'defend' | 'skip' | 'useHealPotion' | 'useArcaneTonic'
  ) => {
    if (!character || !combatState.currentEnemy || !combatState.isInCombat) return;

    const enemy = combatState.currentEnemy;

    // 敌人已被击败时，不再接受新的战斗指令，避免重复结算
    if (enemy.currentHp <= 0) {
      return;
    }

    // Handle stunned turn or skip action
    if (combatState.isPlayerStunned || action === 'skip') {
      const stunnedResult = handleStunnedTurn(character, enemy, combatState);
      let updatedCharacter = stunnedResult.updatedCharacter;
      let newLogs = stunnedResult.newLogs;
      let newApRegenTurns = combatState.apRegenBuffTurnsRemaining;

      // 持续型治愈药水效果：在每个完整回合结束后触发
      if (stunnedResult.combatResult === 'continue' && combatState.apRegenBuffTurnsRemaining > 0) {
        const healPerTurn = Math.floor(
          updatedCharacter.maxAP * COMBAT_CONFIG.HEALING_POTION_AP_PERCENT
        );
        const missingAP = updatedCharacter.maxAP - updatedCharacter.currentAP;
        const healAmount = Math.min(healPerTurn, missingAP);

        if (healAmount > 0) {
          updatedCharacter = {
            ...updatedCharacter,
            currentAP: updatedCharacter.currentAP + healAmount,
          };
          newLogs = [
            ...newLogs,
            {
              id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              turn: combatState.currentTurn,
              text: `治愈药水的效果持续，你恢复了 ${healAmount} 点行动点。`,
              type: 'system',
            },
          ];
        }

        newApRegenTurns = Math.max(0, combatState.apRegenBuffTurnsRemaining - 1);
      }

      setCharacter(updatedCharacter);

      if (stunnedResult.combatResult !== 'continue') {
        endCombat(stunnedResult.combatResult, enemy, newLogs);
        return;
      }

      handleTurnAdvanceOrTimeout(enemy, newLogs, (filteredLogs, nextTurn) => {
        setCombatState(prev => ({
          ...prev,
          combatLogs: filteredLogs,
          currentTurn: nextTurn,
          isPlayerStunned: false,
          enemyNextAction: willEnemyUseStrongAttack() ? 'STRONG' : 'NORMAL',
          apRegenBuffTurnsRemaining: newApRegenTurns,
        }));
      });

      return;
    }

    // Handle potion actions
    if (action === 'useHealPotion' || action === 'useArcaneTonic') {
      let updatedCharacter = { ...character };
      let updatedEnemy = { ...enemy };
      let newLogs = [...combatState.combatLogs];

      const potionKey = action === 'useHealPotion' ? ('POTION' as const) : ('ARCANE_TONIC' as const);
      const template = ALL_ITEMS[potionKey];

      const inventory = [...updatedCharacter.inventory];
      const potionIndex = inventory.findIndex(
        item =>
          item.type === 'Consumable' &&
          item.name === template.name &&
          (item.quantity ?? 1) > 0
      );

      if (potionIndex === -1) {
        alert('背包中没有这种药水');
        return;
      }

      const potionItem = inventory[potionIndex];
      const currentQty = potionItem.quantity ?? 1;
      const newQty = currentQty - 1;

      if (newQty <= 0) {
        inventory.splice(potionIndex, 1);
      } else {
        inventory[potionIndex] = { ...potionItem, quantity: newQty };
      }

      updatedCharacter.inventory = inventory;

      // Log potion use
      newLogs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        turn: combatState.currentTurn,
        text:
          action === 'useHealPotion'
            ? `你使用了「${template.name}」，温暖的能量在体内流转。`
            : `你饮下了「${template.name}」，体内的灵能瞬间被点燃！`,
        type: 'action',
      });

      let newApRegenTurns = combatState.apRegenBuffTurnsRemaining;

      if (action === 'useHealPotion') {
        const healPerTurn = Math.floor(
          updatedCharacter.maxAP * COMBAT_CONFIG.HEALING_POTION_AP_PERCENT
        );
        const missingAP = updatedCharacter.maxAP - updatedCharacter.currentAP;
        const healAmount = Math.min(healPerTurn, missingAP);

        if (healAmount > 0) {
          updatedCharacter.currentAP = updatedCharacter.currentAP + healAmount;
          newLogs.push({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            turn: combatState.currentTurn,
            text: `治愈药水生效，你立即恢复了 ${healAmount} 点行动点，接下来数回合还会持续恢复。`,
            type: 'system',
          });
        }

        // 本回合已触发一次，后续再生效 4 回合
        newApRegenTurns = COMBAT_CONFIG.HEALING_POTION_TURNS - 1;
      } else {
        // Arcane Tonic: instant full AP to 100%
        const gained = updatedCharacter.maxAP - updatedCharacter.currentAP;
        updatedCharacter.currentAP = updatedCharacter.maxAP;
        newLogs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          turn: combatState.currentTurn,
          text: `灵能涌动，你的行动点瞬间回满（+${gained}）。`,
          type: 'system',
        });
      }

      // Enemy attacks after potion use
      const isStrongAttack = combatState.enemyNextAction === 'STRONG';
      const apDamage = calculateAPDamage(updatedEnemy.attack, isStrongAttack, false);
      updatedCharacter.currentAP = Math.max(0, updatedCharacter.currentAP - apDamage);

      if (isStrongAttack) {
        newLogs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          turn: combatState.currentTurn,
          text: `${updatedEnemy.name} 发动强力攻击！消耗了你 ${apDamage} 点行动点，你被击晕了！`,
          type: 'warning',
        });
      } else {
        newLogs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          turn: combatState.currentTurn,
          text: `${updatedEnemy.name} 对你造成了 ${apDamage} 点行动点伤害。`,
          type: 'damage',
        });
      }

      let combatResult: 'continue' | 'defeat' = 'continue';

      if (updatedCharacter.currentAP <= 0) {
        newLogs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          turn: combatState.currentTurn,
          text: `行动点耗尽，战斗失败...`,
          type: 'defeat',
        });
        combatResult = 'defeat';
      }

      const newStunned = isStrongAttack && combatResult === 'continue';

      setCharacter(updatedCharacter);
      if (combatResult !== 'continue') {
        endCombat(combatResult, updatedEnemy, newLogs);
        return;
      }

      handleTurnAdvanceOrTimeout(updatedEnemy, newLogs, (filteredLogs, nextTurn) => {
        setCombatState(prev => ({
          ...prev,
          currentEnemy: updatedEnemy,
          combatLogs: filteredLogs,
          currentTurn: nextTurn,
          isPlayerStunned: newStunned,
          enemyNextAction: willEnemyUseStrongAttack() ? 'STRONG' : 'NORMAL',
          apRegenBuffTurnsRemaining: newApRegenTurns,
        }));
      });

      return;
    }

    // Execute player action (attack or defend)
    let result;
    if (action === 'attack') {
      result = executePlayerAttack(character, enemy, combatState);
    } else {
      result = executePlayerDefend(character, enemy, combatState);
    }

    let updatedCharacter = result.updatedCharacter;
    let updatedEnemy = result.updatedEnemy;
    let newLogs = result.newLogs;
    let newApRegenTurns = combatState.apRegenBuffTurnsRemaining;

    // 持续型治愈药水效果
    if (result.combatResult === 'continue' && combatState.apRegenBuffTurnsRemaining > 0) {
      const healPerTurn = Math.floor(
        updatedCharacter.maxAP * COMBAT_CONFIG.HEALING_POTION_AP_PERCENT
      );
      const missingAP = updatedCharacter.maxAP - updatedCharacter.currentAP;
      const healAmount = Math.min(healPerTurn, missingAP);

      if (healAmount > 0) {
        updatedCharacter = {
          ...updatedCharacter,
          currentAP: updatedCharacter.currentAP + healAmount,
        };
        newLogs.push({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          turn: combatState.currentTurn,
          text: `治愈药水的效果持续，你恢复了 ${healAmount} 点行动点。`,
          type: 'system',
        });
      }

      newApRegenTurns = Math.max(0, combatState.apRegenBuffTurnsRemaining - 1);
    }

    // Determine if player is stunned (strong attack without defense)
    const wasStrongAttack = combatState.enemyNextAction === 'STRONG';
    const newStunned = wasStrongAttack && action !== 'defend' && result.combatResult === 'continue';

    setCharacter(updatedCharacter);

    if (result.combatResult !== 'continue') {
      endCombat(result.combatResult, updatedEnemy, newLogs);
      return;
    }

    handleTurnAdvanceOrTimeout(updatedEnemy, newLogs, (filteredLogs, nextTurn) => {
      setCombatState(prev => ({
        ...prev,
        currentEnemy: updatedEnemy,
        combatLogs: filteredLogs,
        currentTurn: nextTurn,
        isPlayerStunned: newStunned,
        enemyNextAction: willEnemyUseStrongAttack() ? 'STRONG' : 'NORMAL',
        apRegenBuffTurnsRemaining: newApRegenTurns,
      }));
    });
  };

  // Handle retreat attempt
  const handleRetreat = () => {
    if (!character || !combatState.currentEnemy || !combatState.isInCombat) return;

    const result = attemptRetreat(character, combatState.currentEnemy, combatState);
    setCharacter(result.updatedCharacter);

    // If combat ended (escaped or defeat), call endCombat
    if (result.combatResult !== 'continue') {
      endCombat(result.combatResult, combatState.currentEnemy, result.newLogs);
      return;
    }

    const enemy = combatState.currentEnemy!;

    handleTurnAdvanceOrTimeout(enemy, result.newLogs, (filteredLogs, nextTurn) => {
      setCombatState(prev => ({
        ...prev,
        combatLogs: filteredLogs,
        currentTurn: nextTurn, // Failed retreat consumes a turn
        enemyNextAction: willEnemyUseStrongAttack() ? 'STRONG' : 'NORMAL',
      }));
    });
  };

  // Process stunned turn (called when player needs to wait)
  const processCombatTurn = () => {
    if (!character || !combatState.currentEnemy || !combatState.isInCombat) return;

    const stunnedResult = handleStunnedTurn(character, combatState.currentEnemy, combatState);
    setCharacter(stunnedResult.updatedCharacter);

    if (stunnedResult.combatResult !== 'continue') {
      endCombat(stunnedResult.combatResult, combatState.currentEnemy, stunnedResult.newLogs);
      return;
    }

    const enemy = combatState.currentEnemy!;

    handleTurnAdvanceOrTimeout(enemy, stunnedResult.newLogs, (filteredLogs, nextTurn) => {
      setCombatState(prev => ({
        ...prev,
        combatLogs: filteredLogs,
        currentTurn: nextTurn,
        isPlayerStunned: false,
        enemyNextAction: willEnemyUseStrongAttack() ? 'STRONG' : 'NORMAL',
      }));
    });
  };

  // End combat and show settlement screen
  const endCombat = (
    result: 'victory' | 'defeat' | 'escaped' | 'timeout',
    enemy: Enemy,
    logs: CombatLog[],
  ) => {
    if (!character) return;

    // Filter out any明显无效的日志条目（空值等）
    const safeLogs = Array.isArray(logs) ? logs : [];
    const validLogs: CombatLog[] = safeLogs.filter(log => !!log) as CombatLog[];

    // 根据战斗日志推导实际用掉的回合数（等于最后一条日志的 turn）
    const turnsUsed =
      validLogs.length > 0 ? validLogs.reduce((max, log) => Math.max(max, log.turn), 0) : 0;
    let damageDealt = 0;
    let damageTaken = 0;
    let apUsed = 0;

    // Calculate combat stats from logs (simplified)
    validLogs.forEach(log => {
      if (!log.text) return;

      if (log.text.includes('造成') && log.text.includes('伤害')) {
        const match = log.text.match(/(\d+)/);
        if (match) damageDealt += parseInt(match[1]);
      }
      if (log.text.includes('失去') && log.text.includes('AP')) {
        const match = log.text.match(/(\d+)/);
        if (match) apUsed += parseInt(match[1]);
      }
    });

    // Award rewards if victory
    let rewards = { gold: 0, exp: 0, items: [] as string[] };
    if (result === 'victory') {
      rewards = { ...enemy.rewards, items: enemy.rewards.items || [] };
      setCharacter(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          gold: clampGold(prev.gold + rewards.gold),
          exp: prev.exp + rewards.exp,
        };
      });

      // Add reward items to inventory
      if (rewards.items && rewards.items.length > 0) {
        rewards.items.forEach(itemKey => {
          const item = getItemInstance(itemKey as any); // Type assertion for enemy reward items
          addItem(item);
        });
      }

      // Auto-save after victory
      setTimeout(() => autoSave(), 500);
    }

    // Determine failure reason
    let failureReason: string | undefined;
    if (result === 'defeat') {
      failureReason = '行动点耗尽';
    } else if (result === 'timeout') {
      failureReason = '回合用尽，敌人逃走';
    } else if (result === 'escaped') {
      failureReason = '主动撤退';
    }

    // Create combat result
    const combatResult: CombatResult = {
      enemy,
      outcome: result === 'escaped' || result === 'timeout' ? 'retreat' : result,
      turnsUsed,
      rewards,
      playerStats: {
        damageDealt,
        damageTaken,
        apUsed,
      },
      failureReason,
    };

    // Add to session results and show settlement
    setCombatState(prev => {
      return {
        ...prev,
        isInCombat: false,
        showSettlement: true,
        currentResult: combatResult,
        sessionResults: [...prev.sessionResults, combatResult],
        combatLogs: validLogs, // Use filtered logs
      };
    });
  };

  // Continue to next encounter (keep session results)
  const continueEncounter = () => {
    if (!character) return;

    // 开启下一场遭遇战（重置回合与敌人，但保留本次会话的战绩列表）
    startCombat();
  };

  // Return to adventure (generate AI prompt with all battle results)
  const returnToAdventure = () => {
    if (!character) return;

    // Generate summary prompt for all battles in this session
    const results = combatState.sessionResults;
    if (results.length > 0) {
      // Categorize results by outcome
      const victories = results.filter(r => r.outcome === 'victory');
      const defeats = results.filter(r => r.outcome === 'defeat');
      const retreats = results.filter(r => r.outcome === 'retreat');

      // Calculate totals (only from victories)
      const totalGold = victories.reduce((sum, r) => sum + r.rewards.gold, 0);
      const totalExp = victories.reduce((sum, r) => sum + r.rewards.exp, 0);
      const allItems = victories.flatMap(r => r.rewards.items);

      // Build summary text with clear categorization
      let summary = `[战斗总结] 本次探险共进行了 ${results.length} 场战斗\n\n`;

      // Victory section
      if (victories.length > 0) {
        summary += `✓ 胜利 ${victories.length} 次\n`;
        summary += `  ${victories.map(r => `[${r.enemy.rank}级] ${r.enemy.name} (Lv.${r.enemy.level})`).join('、')}\n\n`;
      }

      // Defeat section
      if (defeats.length > 0) {
        summary += `✗ 失败 ${defeats.length} 次\n`;
        summary += `  ${defeats.map(r => `[${r.enemy.rank}级] ${r.enemy.name} (Lv.${r.enemy.level})`).join('、')}`;
        // Show failure reason for the defeat (should only be one)
        if (defeats[0].failureReason) {
          summary += ` - ${defeats[0].failureReason}`;
        }
        summary += '\n\n';
      }

      // Retreat section
      if (retreats.length > 0) {
        summary += `➤ 撤退 ${retreats.length} 次\n`;
        summary += `  ${retreats.map(r => `[${r.enemy.rank}级] ${r.enemy.name} (Lv.${r.enemy.level})`).join('、')}`;
        // Show retreat reason if available
        if (retreats.length === 1 && retreats[0].failureReason) {
          summary += ` - ${retreats[0].failureReason}`;
        }
        summary += '\n\n';
      }

      // Rewards (only if there were victories)
      if (victories.length > 0) {
        summary += `累计获得：${totalGold} 金币、${totalExp} 经验值`;
        if (allItems.length > 0) {
          // 同种战利品堆叠展示
          const itemCounts: Record<string, number> = {};
          allItems.forEach(key => {
            const def = ALL_ITEMS[key as keyof typeof ALL_ITEMS];
            const name = def ? def.name : key;
            itemCounts[name] = (itemCounts[name] || 0) + 1;
          });
          const parts = Object.entries(itemCounts).map(
            ([name, count]) => `${name}×${count}`
          );
          summary += `、道具：${parts.join('、')}`;
        }
      }

      addLog({ speaker: character.name, text: summary, type: 'system' });
    }

    // Reset combat state completely
    setCombatState({
      isInCombat: false,
      currentEnemy: null,
      combatLogs: [],
      currentTurn: 0,
      maxTurns: 10,
      isPlayerStunned: false,
      enemyNextAction: 'NORMAL',
      apRegenBuffTurnsRemaining: 0,
      showSettlement: false,
      currentResult: null,
      sessionResults: [],
    });
  };

  // Save game to DZMM KV storage
  const saveGame = async (slotNumber: number): Promise<void> => {
    if (!character) {
      throw new Error('No character to save');
    }

    const timestamp = Date.now();
    const saveData: SaveData = {
      version: SAVE_VERSION,
      character,
      logs,
      location,
      timestamp,
      opening: currentOpening,
      shopState,
      combatAP: {
        currentAP: character.currentAP,
        maxAP: character.maxAP,
      },
    };

    const key = `${SAVE_KEY_PREFIX}${slotNumber}`;
    await DZMMService.kvPut(key, saveData);

    setLastSaveTimestamp(timestamp);
    setLastSaveLogsCount(logs.length);
    console.log(`[GameContext] Game saved to slot ${slotNumber}`);
  };

  // Auto-save to slot 0 (read-only auto-save slot)
  const autoSave = async (): Promise<void> => {
    if (!character) return;

    try {
      await saveGame(0);
      console.log('[GameContext] Auto-saved to slot 0');
    } catch (error) {
      console.error('[GameContext] Auto-save failed:', error);
    }
  };

  // Load game from DZMM KV storage
  const loadGame = async (slotNumber: number): Promise<boolean> => {
    const key = `${SAVE_KEY_PREFIX}${slotNumber}`;
    const result = await DZMMService.kvGet(key);

    if (!result.value) {
      console.log(`[GameContext] No save data in slot ${slotNumber}`);
      return false;
    }

    const saveData = result.value as SaveData;

    // Version check (for future compatibility)
    if (saveData.version !== SAVE_VERSION) {
      console.warn('[GameContext] Save version mismatch, attempting to load anyway');
    }

    // Backward compatibility: Initialize HP/MP for old saves
    let character = saveData.character;
    if (character.currentHp === undefined || character.maxHp === undefined) {
      console.log('[GameContext] Old save detected, initializing HP/MP');
      const hpMpValues = initializeHpMp(character.level);
      // Apply micro-fluctuation to make it feel natural
      const fluctuatedValues = refreshHpMp(hpMpValues.maxHp, hpMpValues.maxMp);
      character = {
        ...character,
        ...hpMpValues,
        currentHp: fluctuatedValues.currentHp,
        currentMp: fluctuatedValues.currentMp,
      };
    }

    // Backward compatibility: Initialize AP for old saves
    if (character.currentAP === undefined || character.maxAP === undefined) {
      console.log('[GameContext] Old save detected, initializing AP');
      const maxAP = calculateMaxAP(character.level);
      character = {
        ...character,
        currentAP: saveData.combatAP?.currentAP ?? maxAP,
        maxAP: saveData.combatAP?.maxAP ?? maxAP,
        statsBonus: character.statsBonus || { STR: 0, DEX: 0, INT: 0, CHA: 0, LUCK: 0 },
      };
    } else if (saveData.combatAP) {
      // Restore AP from save data
      character = {
        ...character,
        currentAP: saveData.combatAP.currentAP,
        maxAP: saveData.combatAP.maxAP,
      };
    }

    // Clamp gold to global cap
    if (character.gold !== undefined) {
      character = {
        ...character,
        gold: clampGold(character.gold),
      };
    }

    // Restore state
    setCharacter(character);
    setLogs(saveData.logs);
    setLocation(saveData.location);
    setCurrentOpening(saveData.opening || 'main');

    // Restore save tracking (treat as just saved, so no unsaved changes)
    setLastSaveTimestamp(saveData.timestamp);
    setLastSaveLogsCount(saveData.logs.length);

    // Restore shop state with defaults
    setShopState(prev => ({
      currentItemKey: saveData.shopState?.currentItemKey ?? prev.currentItemKey ?? null,
      nextRefreshAt: saveData.shopState?.nextRefreshAt ?? Date.now(),
      purchasedKeys: saveData.shopState?.purchasedKeys ?? [],
      achievementClaimed: saveData.shopState?.achievementClaimed ?? false,
    }));

    // After shop state is restored, recompute stats bonus including relics
    setCharacter(prev =>
      prev
        ? {
            ...prev,
            statsBonus: computeTotalStatsBonus(prev.inventory),
          }
        : prev
    );
    refreshShop();

    console.log(`[GameContext] Game loaded from slot ${slotNumber}`);
    return true;
  };

  // Get save preview without loading full data
  const getSavePreview = async (slotNumber: number): Promise<SavePreview | null> => {
    const key = `${SAVE_KEY_PREFIX}${slotNumber}`;
    const result = await DZMMService.kvGet(key);

    if (!result.value) {
      return null;
    }

    const saveData = result.value as SaveData;

    return {
      characterName: saveData.character.name,
      level: saveData.character.level,
      gold: saveData.character.gold,
      exp: saveData.character.exp,
      location: saveData.location,
      timestamp: new Date(saveData.timestamp).toLocaleString('zh-CN'),
      messageCount: saveData.logs.length,
      avatarUrl: saveData.character.avatarUrl || '',
      classType: saveData.character.classType,
      questsCompleted: saveData.character.completedQuests.length,
      questsActive: saveData.character.activeQuests.length,
      legendaryPurchased: saveData.shopState?.purchasedKeys?.length ?? 0,
    };
  };

  const value: GameContextType = {
    character,
    logs,
    location,
    isDzmmReady,
    currentOpening,
    selectedModel,
    shopState,
    lastSaveTimestamp,
    combatState,
    devForceTreasureMonster,
    setCharacter,
    setLogs,
    setLocation,
    setCurrentOpening,
    setSelectedModel,
    refreshShop,
    purchaseShopItem,
    claimOverlordProof,
    addLog,
    clearLogs,
    resetGameState,
    hasUnsavedChanges,
    addItem,
    removeItem,
    useItem,
    acceptQuest,
    completeQuest,
    startCombat,
    executeCombatAction,
    handleRetreat,
    processCombatTurn,
    continueEncounter,
    returnToAdventure,
    saveGame,
    loadGame,
    getSavePreview,
    autoSave,
    setDevForceTreasureMonster,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Hook to access game context
 * Must be used within GameProvider
 */
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
