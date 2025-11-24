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
import { Character, LogEntry, Item } from '../../types';
import { DZMMService } from '../services/dzmmService';
import { initializeHpMp, refreshHpMp } from '../utils/hpMpSystem';
import { LEGENDARY_SHOP_ITEMS, LEGENDARY_SHOP_PRICE, getItemInstance, ALL_ITEMS, clampGold, MAX_STACK } from '../../constants';

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

  // Setters
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setLocation: (loc: string) => void;
  setCurrentOpening: (opening: string) => void;
  setSelectedModel: (model: string) => void;
  refreshShop: (force?: boolean) => void;
  purchaseShopItem: () => boolean;
  claimOverlordProof: () => boolean;

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
    setCharacter(prev => prev ? { ...prev, inventory: [...prev.inventory, proof] } : prev);
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
          };
        }

        // 如果没有同名消耗品，则新增格子（自身数量也限制在上限内）
        const clampedItem: Item = {
          ...item,
          quantity: Math.min(incomingQty, MAX_STACK),
        };

        return {
          ...prev,
          inventory: [...prev.inventory, clampedItem],
        };
      }

      // 非消耗品：直接新增格子
      return {
        ...prev,
        inventory: [...prev.inventory, item],
      };
    });
  };

  // Remove item from inventory
  const removeItem = (itemId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: prev.inventory.filter((i) => i.id !== itemId),
      };
    });
  };

  // Use consumable item (quantity - 1, remove if 0)
  const useItem = (itemId: string) => {
    setCharacter(prev => {
      if (!prev) return prev;

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

      return {
        ...prev,
        inventory: updatedInventory,
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
    saveGame,
    loadGame,
    getSavePreview,
    autoSave,
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
