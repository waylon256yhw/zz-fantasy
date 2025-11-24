import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TypewriterText } from '../components/RPGComponents';
import { Character, CharacterStats, LogEntry, Item, ClassType } from '../types';
import { STARTING_LOGS, CLASS_LABELS, IMAGES, getAvailableQuests, getActiveQuests, getCompletedQuests, ALL_ITEMS, LEGENDARY_SHOP_ITEMS, LEGENDARY_SHOP_PRICE, MAP_GRAPH, MAP_SHORT_NAMES, RESTAURANT_ITEMS, SHOP_POTION_ITEMS, getItemInstance, clampGold, MAX_STACK } from '../constants';
import { useGame, ShopState } from '../src/contexts/GameContext';
import { DZMMService } from '../src/services/dzmmService';
import { buildSystemPrompt, buildPlayerContext, buildOpeningGreeting } from '../src/utils/promptBuilder';
import { detectEvents, applyEvents } from '../src/utils/eventDetector';
import { parseRichText } from '../src/utils/richTextParser';
import { detectQuestCompletion } from '../src/utils/questDetector';
import { addExperience, EXP_SOURCES, getLevelUpMessage, getExpProgress } from '../src/utils/levelSystem';
import { updateHpMpOnLevelUp, applyAdventureFatigue } from '../src/utils/hpMpSystem';
import { calculateAttackPower } from '../src/utils/combatSystem';
import {
  Backpack,
  User,
  Map as MapIcon,
  Settings,
  Send,
  X,
  Star,
  ShieldCheck,
  Menu,
  Sparkles,
  Feather,
  LogOut,
  ChevronRight,
  RotateCcw,
  Edit2,
  Trash2,
  ShoppingBag,
  Coins,
  Crown,
  Map,
  MapPin,
  Utensils,
  Swords
} from 'lucide-react';
import { CombatSheet } from '../components/CombatSheet';
import { CombatResultSheet } from '../components/CombatResultSheet';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

type SheetType = 'INVENTORY' | 'STATUS' | 'GUILD' | 'SHOP' | 'HONOR' | 'MAP' | 'RESTAURANT' | 'COMBAT' | null;
const CHEAT_MODE = false; // 开发专用金手指，发布前请置为 false

const getInitialLocationForClass = (classType: ClassType): string => {
  switch (classType) {
    case ClassType.SKY_PIRATE:
      return '碧空港 - 飞艇码头';
    case ClassType.SCHOLAR:
      return '王都阿斯拉 - 中央广场';
    case ClassType.ALCHEMIST:
    case ClassType.KNIGHT:
    default:
      return '王都阿斯拉 - 中央广场';
  }
};

const GameInterface: React.FC = () => {
  const { character, logs, setLogs, location, isDzmmReady, currentOpening, addLog, setCharacter, selectedModel, acceptQuest, completeQuest, useItem, shopState, refreshShop, purchaseShopItem, claimOverlordProof, setLocation, resetGameState, autoSave, hasUnsavedChanges, combatState, startCombat, executeCombatAction, handleRetreat, processCombatTurn, continueEncounter, returnToAdventure, devForceTreasureMonster, setDevForceTreasureMonster } = useGame();
  const navigate = useNavigate();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [input, setInput] = useState('');
  const [showMobileCharCard, setShowMobileCharCard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [rerollingIndex, setRerollingIndex] = useState<number | null>(null);
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!character) {
      navigate('/create');
      return;
    }

    if (logs.length === 0) {
      const openingText = buildOpeningGreeting(character);
      const openingLog: LogEntry = {
        id: 'init-0',
        speaker: '', // 旁白 / 第三人称叙述者
        text: openingText,
        type: 'dialogue',
      };

      // 根据职业设置初始位置，让地图与开场白保持一致
      const initialLocation = getInitialLocationForClass(character.classType);
      if (initialLocation !== location) {
        setLocation(initialLocation);
      }

      setLogs([openingLog]);
    }
  }, [character, navigate, logs.length, location, setLocation, setLogs]);

  useEffect(() => {
    if (logsContainerRef.current) {
      const container = logsContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs, activeSheet]);

  // Browser close protection: warn if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '你有未保存的游戏进度，确定要离开吗？';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle player action with DZMM API
  const handleAction = async (rawAction: string) => {
    const finalAction = rawAction.trim();
    if (!finalAction || !character || isGenerating) return;

    setIsGenerating(true);
    setInput('');

    // Add player message
    const playerLog: LogEntry = {
      id: `player_${Date.now()}`,
      speaker: character.name,
      text: finalAction,
      type: 'dialogue'
    };

    // Prepare AI message placeholder (use dialogue type, empty speaker for third-person narration)
    const aiLogId = `ai_${Date.now()}`;
    const aiLog: LogEntry = {
      id: aiLogId,
      speaker: '', // Empty speaker for third-person narration
      text: '',
      type: 'dialogue'
    };

    // Update logs state with both messages at once
    const updatedLogs = [...logs, playerLog, aiLog];
    setLogs(updatedLogs);

    try {
      // Build messages array for DZMM API (last 15 dialogue entries, excluding the AI placeholder)
      // 只把真正的“对话”日志发送给模型，像战斗总结这类叙事性（type === 'narration'）的玩家气泡
      // 只在前端展示，不进入提示词上下文，避免干扰模型注意力。
      const recentLogs = updatedLogs
        .filter(log => log.id !== aiLogId && log.type === 'dialogue')
        .slice(-15);
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      // Add system prompt as first user message (with active quest info)
      messages.push({
        role: 'user',
        content: buildSystemPrompt(character, location, character.activeQuests)
      });

      // Add conversation history (alternating roles)
      for (const log of recentLogs) {
        const role = log.speaker === character.name ? 'user' : 'assistant';
        const lastMessage = messages[messages.length - 1];

        // Merge consecutive same-role messages to avoid validation error
        if (lastMessage && lastMessage.role === role) {
          lastMessage.content += `\n${log.text}`;
        } else {
          messages.push({ role, content: log.text });
        }
      }

      // Add current action with <last_input> emphasis block + D0 玩家上下文
      const lastInputBlock = `<last_input>
玩家当前指令如下，请以此为最高优先级进行叙事响应：
${finalAction}
</last_input>`;

      const playerContextBlock = buildPlayerContext(
        character,
        location,
        character.activeQuests,
        shopState.purchasedKeys?.length || 0
      );
      const combinedBlock = `${lastInputBlock}\n\n${playerContextBlock}`;

      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        lastMsg.content += `\n\n${combinedBlock}`;
      } else {
        messages.push({ role: 'user', content: combinedBlock });
      }

      // Call DZMM API with streaming (use selected model)
      await DZMMService.completions(
        {
          model: selectedModel as any,
          messages,
          maxTokens: 2000
        },
        (content, done) => {
          // Update AI message in real-time
          setLogs(prev => prev.map(log =>
            log.id === aiLogId ? { ...log, text: content } : log
          ));

          if (done) {
            // Detect game events and update character state
            const events = detectEvents(content);
            if (events.length > 0 && character) {
              const currentHp = 100; // TODO: Add HP to character model

              const updates = applyEvents(
                events,
                currentHp,
                500,
                character.gold,
                character.exp
              );

              // Update character with new values (use functional update to preserve latest state)
              setCharacter(prev => prev ? {
                ...prev,
                gold: clampGold(updates.gold)
              } : prev);
            }

            // Add dialogue experience (slow progression)
            if (character) {
              const expResult = addExperience(character.level, character.exp, EXP_SOURCES.DIALOGUE);

              setCharacter(prev => {
                if (!prev) return prev;

                // Update HP/MP based on level change or fatigue
                let hpMpUpdates = {};
                if (expResult.levelsGained > 0) {
                  // Level up: restore to 90%-100%
                  hpMpUpdates = updateHpMpOnLevelUp(
                    prev.level,
                    expResult.newLevel,
                    prev.currentHp,
                    prev.currentMp
                  );
                } else {
                  // No level up: apply adventure fatigue (0.5%-2% drain)
                  hpMpUpdates = applyAdventureFatigue(
                    prev.currentHp,
                    prev.maxHp,
                    prev.currentMp,
                    prev.maxMp
                  );
                }

                return {
                  ...prev,
                  level: expResult.newLevel,
                  exp: expResult.newExp,
                  ...hpMpUpdates,
                };
              });

              // Show level up notification
              if (expResult.levelsGained > 0) {
                console.log(`[Level Up] ${getLevelUpMessage(character.name, expResult.newLevel, expResult.levelsGained)}`);
              }
            }

            // Detect quest completion
            if (character && character.activeQuests.length > 0) {
              const questResult = detectQuestCompletion(content, character.activeQuests);

              if (questResult.completedQuestIds.length > 0) {
                // Calculate quest completion EXP reward
                const questExpGain = questResult.completedQuestIds.length * EXP_SOURCES.QUEST_COMPLETE;
                const expResult = addExperience(character.level, character.exp, questExpGain);

                // Update character: complete quests and add rewards
                setCharacter(prev => {
                  if (!prev) return prev;

                  // Remove from active, add to completed
                  const newActiveQuests = prev.activeQuests.filter(
                    id => !questResult.completedQuestIds.includes(id)
                  );
                  const newCompletedQuests = [
                    ...prev.completedQuests,
                    ...questResult.completedQuestIds
                  ];

                  // Update HP/MP if level changed
                  let hpMpUpdates = {};
                  if (expResult.levelsGained > 0) {
                    hpMpUpdates = updateHpMpOnLevelUp(
                      prev.level,
                      expResult.newLevel,
                      prev.currentHp,
                      prev.currentMp
                    );
                  }

                  return {
                    ...prev,
                    activeQuests: newActiveQuests,
                    completedQuests: newCompletedQuests,
                    gold: clampGold(prev.gold + questResult.rewards.gold),
                    level: expResult.newLevel,
                    exp: expResult.newExp,
                    ...hpMpUpdates,
                  };
                });

                // Show notifications
                questResult.rewards.notifications.forEach(notif => {
                  console.log(`[Quest] ${notif}`);
                });

                // Show level up notification for quest completion
                if (expResult.levelsGained > 0) {
                  console.log(`[Level Up] ${getLevelUpMessage(character.name, expResult.newLevel, expResult.levelsGained)}`);
                }

                autoSave(); // Auto-save after quest completion
              }
            }

            setIsGenerating(false);

            // Apply pending location change (if user actually sent the travel message)
            if (pendingLocation) {
              // Only apply if the actual sent action text包含目标地点名称
              if (rawAction.includes(pendingLocation)) {
                setLocation(pendingLocation);
                autoSave(); // Auto-save after location change
              }
              setPendingLocation(null);
            }

            // Auto-scroll to bottom
            setTimeout(() => {
              if (logsContainerRef.current) {
                logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
              }
            }, 100);
          }
        }
      );
    } catch (error) {
      console.error('[GameInterface] AI generation failed:', error);
      // Remove placeholder AI message on error
      setLogs(prev => prev.filter(log => log.id !== aiLogId));
      setIsGenerating(false);
      alert('AI生成失败，请重试');
    }
  };

  // Reroll/Regenerate AI response
  const handleReroll = async (index: number) => {
    if (isGenerating || !character) return;

    setRerollingIndex(index);

    // Get context before this message
    const contextLogs = logs.slice(0, index);
    const targetLog = logs[index - 1]; // The user message before AI response

    if (!targetLog || targetLog.speaker !== character.name) {
      alert('无法重新生成此消息');
      setRerollingIndex(null);
      return;
    }

    // Remove this and all subsequent messages
    setLogs(contextLogs);

    // Regenerate response
    await handleAction(targetLog.text);
    setRerollingIndex(null);
  };

  // Edit player message
  const handleEdit = (index: number) => {
    const log = logs[index];
    if (log.speaker !== character?.name) return;

    setEditingIndex(index);
    setEditText(log.text);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (editingIndex === null || !editText.trim()) return;

    // Update message
    setLogs(prev => prev.map((log, i) =>
      i === editingIndex ? { ...log, text: editText } : log
    ));

    // Remove all messages after this
    setLogs(prev => prev.slice(0, editingIndex + 1));

    // Trigger new AI response
    await handleAction(editText);

    setEditingIndex(null);
    setEditText('');
  };

  // Delete message and all following
  const handleDelete = (index: number) => {
    if (!confirm('删除此消息及之后的所有内容？')) return;

    setLogs(prev => prev.slice(0, index));
  };

  const handleSystemClick = () => {
    navigate('/save', { state: { fromGame: true } });
  };

  const handleRestaurantPurchase = (key: keyof typeof ALL_ITEMS, price: number) => {
    if (!character) return;

    const template = ALL_ITEMS[key];

    // 查找已存在的同名消耗品堆叠
    const existingStack = character.inventory.find(
      item => item.type === 'Consumable' && item.name === template.name
    );

    if (existingStack) {
      const currentQty = existingStack.quantity ?? 1;
      if (currentQty >= MAX_STACK) {
        alert('该料理单格最多堆叠 99 个，请先使用一些再购买');
        return;
      }
    }

    if (character.gold < price) {
      alert('金币不足，无法购买这道料理');
      return;
    }

    setCharacter(prev => {
      if (!prev) return prev;

      // 如果已有同名消耗品，则叠加数量（单格上限 99）
      const existingIndex = prev.inventory.findIndex(
        item => item.type === 'Consumable' && item.name === template.name
      );

      if (existingIndex !== -1) {
        const inventory = [...prev.inventory];
        const existing = inventory[existingIndex];
        const currentQty = existing.quantity ?? 1;
        const newQty = Math.min(currentQty + 1, MAX_STACK);
        inventory[existingIndex] = { ...existing, quantity: newQty };

        return {
          ...prev,
          gold: clampGold(prev.gold - price),
          inventory,
        };
      }

      // 否则新增一个储存格（数量默认 1，不会超过上限）
      const itemInstance = getItemInstance(key);
      return {
        ...prev,
        gold: clampGold(prev.gold - price),
        inventory: [...prev.inventory, itemInstance],
      };
    });

    addLog({
      speaker: '系统',
      text: `你在酒馆点了「${template.name}」，花费了 ${price} G。`,
      type: 'system',
    });

    autoSave(); // Auto-save after restaurant purchase
  };

  const handleShopPotionPurchase = (key: keyof typeof ALL_ITEMS, price: number) => {
    if (!character) return;

    const template = ALL_ITEMS[key];

    if (template.type !== 'Consumable') {
      return;
    }

    // 查找已存在的同名消耗品堆叠
    const existingStack = character.inventory.find(
      item => item.type === 'Consumable' && item.name === template.name
    );

    if (existingStack) {
      const currentQty = existingStack.quantity ?? 1;
      if (currentQty >= MAX_STACK) {
        alert('该药水单格最多堆叠 99 个，请先使用一些再购买');
        return;
      }
    }

    if (character.gold < price) {
      alert('金币不足，无法购买这瓶药水');
      return;
    }

    setCharacter(prev => {
      if (!prev) return prev;

      const existingIndex = prev.inventory.findIndex(
        item => item.type === 'Consumable' && item.name === template.name
      );

      if (existingIndex !== -1) {
        const inventory = [...prev.inventory];
        const existing = inventory[existingIndex];
        const currentQty = existing.quantity ?? 1;
        const newQty = Math.min(currentQty + 1, MAX_STACK);
        inventory[existingIndex] = { ...existing, quantity: newQty };

        return {
          ...prev,
          gold: clampGold(prev.gold - price),
          inventory,
        };
      }

      const itemInstance = getItemInstance(key);
      return {
        ...prev,
        gold: clampGold(prev.gold - price),
        inventory: [...prev.inventory, itemInstance],
      };
    });

    addLog({
      speaker: '系统',
      text: `你在万宝阁购入了「${template.name}」，花费了 ${price} G。`,
      type: 'system',
    });

    autoSave();
  };

  if (!character) return null;

  return (
    <>
      {/* Rich Text Styles */}
      <style>{`
        .rich-text-content em {
          font-style: italic;
          color: #6B46C1;
          background: linear-gradient(120deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%);
          padding: 0.05em 0.25em;
          border-radius: 3px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .rich-text-content .dialogue {
          color: #1E40AF;
          font-weight: 700;
          position: relative;
          text-shadow: 0 0 1px rgba(30, 64, 175, 0.15);
          letter-spacing: 0.02em;
        }
        .rich-text-content .dialogue::before,
        .rich-text-content .dialogue::after {
          color: #3B82F6;
          font-weight: 700;
          opacity: 0.7;
        }
      `}</style>

      <div className="h-screen relative w-full bg-[#FFF9F0] overflow-hidden flex flex-col md:flex-row p-4 md:p-6 gap-6 font-sans">

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <motion.img
           src={IMAGES.bg.plaza}
           alt="Background"
           className="absolute inset-0 w-full h-full object-cover opacity-100"
           animate={{
             scale: [1, 1.05, 1],
             x: [0, -10, 0],
             y: [0, -5, 0]
           }}
           transition={{
             duration: 30,
             repeat: Infinity,
             ease: "easeInOut"
           }}
         />
         <div className="absolute inset-0 bg-[#FFF9F0]/40 backdrop-blur-[1px]" />
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-yellow-200/20 rounded-full blur-[120px] mix-blend-overlay" />
      </div>

      {/* MOBILE: Side Toggle for Character Card */}
      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="lg:hidden fixed left-0 top-32 z-40 group"
        onClick={() => setShowMobileCharCard(true)}
      >
        <div className="relative bg-white/50 hover:bg-white/70 backdrop-blur-md border border-l-0 border-white/50 rounded-r-xl py-3 pl-1.5 pr-1 shadow-sm flex flex-col items-center gap-1 transition-all active:scale-95 active:translate-x-1">
            {/* Pulsing Indicator for First-time Users */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF9FAA] rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF9FAA] rounded-full" />

            <span className="[writing-mode:vertical-rl] text-[10px] font-bold text-[#5D4037] tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity">
                立绘
            </span>
            <ChevronRight size={12} className="text-[#5D4037]/50" />
        </div>
      </motion.button>

      {/* LEFT COLUMN: Character Card (Desktop) */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:block w-[380px] xl:w-[420px] relative z-10 h-full flex-none"
      >
         <CharacterCardView character={character} />
      </motion.div>

      {/* RIGHT COLUMN: Interaction Terminal */}
      <div className="flex-1 flex flex-col relative z-10 h-full min-w-0">
          
          {/* Header Navigation - Adapted for Mobile */}
          <header className="flex-none flex items-center mb-4 px-0 md:px-1 z-50 h-14">
              {/* Compact single-row Nav Container */}
              <div className="flex flex-nowrap gap-1 md:gap-2 flex-1 items-center overflow-x-auto no-scrollbar pb-1 -mb-1 pl-2 pr-4 md:pl-2 md:pr-3">
                  <NavButton icon={<Backpack size={16} />} label="背包" onClick={() => setActiveSheet('INVENTORY')} />
                  <NavButton icon={<Swords size={16} />} label="战斗" onClick={() => setActiveSheet('COMBAT')} />
                  <NavButton icon={<ShieldCheck size={16} />} label="公会" onClick={() => setActiveSheet('GUILD')} />
                  <NavButton icon={<ShoppingBag size={16} />} label="商店" onClick={() => { refreshShop(); setActiveSheet('SHOP'); }} />
                  <NavButton icon={<Utensils size={16} />} label="餐厅" onClick={() => setActiveSheet('RESTAURANT')} />
                  <NavButton icon={<Crown size={16} />} label="荣誉墙" onClick={() => setActiveSheet('HONOR')} />
                  <NavButton icon={<Map size={16} />} label="地图" onClick={() => setActiveSheet('MAP')} />
                  {CHEAT_MODE && (
                    <>
                      <button
                        onClick={() => {
                          if (!character) return;
                          setCharacter(prev => prev ? { ...prev, gold: clampGold(prev.gold + 1000) } : prev);
                          addLog({ speaker: '系统', text: '[DEV] 金币 +1000 (测试专用)', type: 'system' });
                        }}
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-200 shadow-sm text-[11px] font-bold hover:bg-red-100 active:scale-95 shrink-0 flex items-center gap-1"
                        title="DEV ONLY: 发布前请关闭"
                      >
                        <Coins size={14} /> DEV+1000G
                      </button>
                      <button
                        onClick={() => setDevForceTreasureMonster(!devForceTreasureMonster)}
                        className={`px-3 py-2 rounded-lg border shadow-sm text-[11px] font-bold active:scale-95 shrink-0 flex items-center gap-1 ${
                          devForceTreasureMonster
                            ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                            : 'bg-white text-[#5D4037] border-[#E6D7C3] hover:bg-[#FFF3E0]'
                        }`}
                        title="DEV ONLY: 遭遇战必定遇到珍宝怪"
                      >
                        <Sparkles size={14} />
                        {devForceTreasureMonster ? '稀有怪：开' : '稀有怪：关'}
                      </button>
                    </>
                  )}
                  <div className="w-px h-6 md:h-8 bg-[#E6D7C3] mx-0.5 md:mx-1 shrink-0" />
                  <NavButton icon={<Menu size={16} />} label="系统" onClick={handleSystemClick} />

                  <button
                    onClick={() => {
                      // Check for unsaved changes before exiting
                      if (hasUnsavedChanges()) {
                        if (confirm('你有未保存的游戏进度，确定要退出吗？进度将会丢失。')) {
                          navigate('/');
                        }
                      } else {
                        navigate('/');
                      }
                    }}
                    className="group bg-white/80 hover:bg-red-50 text-[#5D4037] hover:text-red-500 px-1.5 md:px-2.5 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-white hover:border-red-200 shadow-sm transition-all active:scale-95 flex items-center gap-1 shrink-0 ml-0.5 md:ml-1"
                    title="返回标题"
                  >
                    <LogOut size={18} />
                    <span className="hidden lg:inline text-[11px] font-bold">退出</span>
                  </button>
              </div>
          </header>

          {/* Main Chat Area */}
          <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl overflow-hidden flex flex-col relative ring-1 ring-gray-100">
              <div 
                ref={logsContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar scroll-smooth"
              >
                 <AnimatePresence initial={false}>
                 {logs.map((log) => (
                   <motion.div
                     key={log.id}
                     initial={{ opacity: 0, y: 10, scale: 0.98 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     className={`flex w-full ${
                        log.speaker === character.name ? 'justify-end' : 'justify-start'
                     }`}
                   >
                      {/* All messages use bubble style now, no narration style */}
                      {(
                        <div className={`flex ${log.speaker === character.name ? 'max-w-[85%] md:max-w-[75%]' : 'max-w-[95%] md:max-w-[85%]'} gap-4 ${log.speaker === character.name ? 'flex-row-reverse' : 'flex-row'} group/message`}>
                           {/* Only show avatar for player messages */}
                           {log.speaker === character.name && (
                             <div className="shrink-0 mt-2 relative z-10">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] shadow-sm overflow-hidden bg-gray-100 border-[#FF9FAA]">
                                  <img src={character.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                             </div>
                           )}
                           <div className={`flex flex-col min-w-0 ${log.speaker === character.name ? 'items-end' : 'items-start'} flex-1`}>
                              {/* Never show speaker name - player is identified by avatar, AI is anonymous third-person */}
                              <div className="flex items-start gap-2 w-full">
                                <div className={`relative px-5 py-3 md:px-6 md:py-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] text-sm md:text-[15px] leading-relaxed transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] break-words whitespace-pre-wrap ${
                                log.speaker === character.name
                                 ? 'bg-gradient-to-br from-[#FF9FAA] to-[#FF8A9B] text-white rounded-[22px] rounded-tr-sm min-w-[40px] border-2 border-white/20 shadow-[0_4px_10px_rgba(255,159,170,0.4)]'
                                 : 'bg-[#FFFDF7] text-[#5D4037] rounded-[20px] border border-[#F0EAE0] min-w-[40px] w-full'
                              }`}>
                                {log.speaker !== character.name && (
                                   <>
                                     <CornerDecor className="top-0 left-0 -rotate-0 text-[#E6D7C3]" />
                                     <CornerDecor className="bottom-0 right-0 rotate-180 text-[#E6D7C3]" />
                                   </>
                                )}
                                {log.speaker === character.name && (
                                  <>
                                    <motion.div
                                      className="absolute -top-3 -left-3 bg-white text-[#FF9FAA] rounded-full p-1 shadow-sm border border-[#FF9FAA]/20"
                                      animate={{
                                        rotate: [0, 360],
                                        scale: [1, 1.1, 1]
                                      }}
                                      transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    >
                                        <Star size={12} fill="currentColor" />
                                    </motion.div>
                                    <div className="absolute inset-[1px] rounded-[20px] rounded-tr-sm border border-white/30 pointer-events-none" />
                                  </>
                                )}
                                
                                {log.speaker === character.name ? (
                                  editingIndex === logs.indexOf(log) ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-[#FF9FAA] bg-white/90 text-[#5D4037] text-sm"
                                        rows={3}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleSaveEdit}
                                          className="px-3 py-1 bg-[#FF9FAA] text-white text-xs rounded-lg hover:bg-[#FF8A9B]"
                                        >
                                          保存
                                        </button>
                                        <button
                                          onClick={() => { setEditingIndex(null); setEditText(''); }}
                                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-400"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span>{log.text}</span>
                                  )
                                ) : (
                                  log.text ? (
                                    <div
                                      dangerouslySetInnerHTML={{ __html: parseRichText(log.text) }}
                                      className="rich-text-content"
                                    />
                                  ) : (
                                    <span className="text-gray-400 italic">生成中...</span>
                                  )
                                )}
                                </div>

                                {/* Message Action Buttons (hover to show) */}
                                {editingIndex !== logs.indexOf(log) && (
                                  <div className={`flex-none opacity-0 group-hover/message:opacity-100 transition-opacity flex flex-col gap-1 mt-1 ${log.speaker === character.name ? 'order-first' : ''}`}>
                                    {log.speaker === character.name && (
                                      <>
                                        <button
                                          onClick={() => handleEdit(logs.indexOf(log))}
                                          className="p-1.5 rounded-lg bg-white/80 hover:bg-[#FFD166] text-[#5D4037] hover:text-white transition-colors shadow-sm"
                                          title="编辑"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(logs.indexOf(log))}
                                          className="p-1.5 rounded-lg bg-white/80 hover:bg-red-400 text-[#5D4037] hover:text-white transition-colors shadow-sm"
                                          title="删除"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      )}
                   </motion.div>
                 ))}
                 </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="flex-none p-4 md:p-6 pb-6 md:pb-6 bg-white border-t border-[#F0EAE0] relative z-20">
                  <div className="flex items-center gap-3 bg-[#FDFBF7] p-2 pr-2 pl-5 rounded-2xl border-2 border-[#E6D7C3] focus-within:border-[#FF9FAA] focus-within:ring-4 focus-within:ring-[#FF9FAA]/10 transition-all shadow-inner">
                     <Feather className="text-[#D4C5B0] shrink-0" size={18} />
                     <input 
                       className="flex-1 bg-transparent border-none outline-none text-[#5D4037] font-medium placeholder:text-[#D4C5B0] text-sm md:text-base"
                       placeholder="描述你的行动..."
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAction(input)}
                     />
                     <button
                       onClick={() => input && handleAction(input)}
                       disabled={!input || isGenerating}
                       className="bg-[#FF9FAA] hover:bg-[#FF8A9B] disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 md:p-3 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2 font-bold"
                     >
                        {isGenerating ? (
                          <>
                            <span className="hidden md:inline">生成中</span>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          </>
                        ) : (
                          <>
                            <span className="hidden md:inline">发送</span>
                            <Send size={18} fill="currentColor" />
                          </>
                        )}
                     </button>
                  </div>
              </div>
          </div>
      </div>

      {/* MOBILE OVERLAY: Character Card */}
      <AnimatePresence>
        {showMobileCharCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 lg:hidden"
            onClick={() => setShowMobileCharCard(false)}
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="w-full max-w-[360px] aspect-[3/5] relative"
               onClick={(e) => e.stopPropagation()}
             >
                {/* Close Button */}
                <button 
                  onClick={() => setShowMobileCharCard(false)}
                  className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-white/30"
                >
                    <X size={20} />
                </button>
                
                <CharacterCardView character={character} />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popups / Sheets */}
      <AnimatePresence>
        {activeSheet && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-[#5D4037]/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
            onClick={() => setActiveSheet(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl h-[80vh] bg-[#FFFBF0] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative border-4 border-white"
              onClick={(e) => e.stopPropagation()}
            >
               <button 
                  onClick={() => setActiveSheet(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-[#E6D7C3] hover:bg-[#FF9FAA] text-white rounded-full flex items-center justify-center transition-colors z-20 shadow-sm"
               >
                  <X size={20} />
               </button>

               {activeSheet === 'INVENTORY' && <InventorySheet items={character.inventory} onUseItem={(itemId, itemName) => {
                 // 禁止在背包中直接使用战斗药水（仅战斗内通过“喝药”使用）
                 const item = character.inventory.find(i => i.id === itemId);
                 if (item && item.type === 'Consumable' && (item.name === '治愈药水' || item.name === '秘药：灵能酿')) {
                   alert('战斗用药水只能在战斗中通过“喝药”按钮使用，日常请使用食物恢复体力。');
                   return;
                 }

                 if (!item) return;

                 if (item.type === 'Consumable') {
                   // 立即消耗食物并恢复 AP（useItem 内部已经处理 AP 结算）
                   useItem(itemId);
                   autoSave();

                   // 使用提示框而不是在对话区打印文本
                   alert(`你吃掉了「${itemName}」，感觉恢复了一些体力。`);
                 }

                 setActiveSheet(null);
               }} />}
               {activeSheet === 'STATUS' && <StatusSheet character={character} />}
               {activeSheet === 'COMBAT' && !combatState.showSettlement && (
                 <CombatSheet
                   character={character}
                   combatState={combatState}
                   location={location}
                   onAction={(action) => {
                     if (action === 'encounter') {
                       startCombat();
                     } else if (
                       action === 'attack' ||
                       action === 'defend' ||
                       action === 'skip' ||
                       action === 'useHealPotion' ||
                       action === 'useArcaneTonic'
                     ) {
                       executeCombatAction(action);
                     } else if (action === 'retreat') {
                       handleRetreat();
                     }
                   }}
                 />
               )}
               {activeSheet === 'COMBAT' && combatState.showSettlement && combatState.sessionResults.length > 0 && (
                 <CombatResultSheet
                   results={combatState.sessionResults}
                   character={character}
                   onContinueCombat={() => {
                     continueEncounter();
                   }}
                   onReturnToAdventure={() => {
                     returnToAdventure();
                     setActiveSheet(null); // Close combat sheet
                   }}
                 />
               )}
               {activeSheet === 'GUILD' && <GuildSheet character={character} onAcceptQuest={(questId, questTitle) => {
                 // Accept quest and close sheet
                 acceptQuest(questId);
                 autoSave(); // Auto-save after accepting quest
                 setActiveSheet(null);
                 // Auto-send user message
                 setInput(`我接受了任务：${questTitle}`);
                 setTimeout(() => {
                   handleAction(`我接受了任务：${questTitle}`);
                 }, 100);
               }} />}
               {activeSheet === 'SHOP' && <ShopSheet shopState={shopState} gold={character.gold} onRefresh={() => refreshShop(true)} onPurchase={() => {
                 const success = purchaseShopItem();
                 if (success) {
                   autoSave(); // Auto-save after successful purchase
                 } else {
                   alert('金币不足或没有可售物品');
                 }
               }} onPurchasePotion={handleShopPotionPurchase} />}
              {activeSheet === 'RESTAURANT' && (
                <RestaurantSheet
                  gold={character.gold}
                  onPurchase={handleRestaurantPurchase}
                />
              )}
              {activeSheet === 'HONOR' && <HonorWall shopState={shopState} onClaim={claimOverlordProof} />}
              {activeSheet === 'MAP' && <MapSheet location={location} onSelect={(loc) => {
                 setActiveSheet(null);
                 setPendingLocation(loc);
                 setInput(`我准备从${location}前往${loc}`);
               }} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

// --- Reusable Character Card View ---
const CharacterCardView = ({ character, className = "" }: { character: Character, className?: string }) => (
    <div className={`relative h-full w-full bg-[#2C241F] rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-white ring-1 ring-gray-200 group hover:shadow-[0_0_50px_rgba(255,159,170,0.3)] transition-all duration-500 ${className}`}>

        {/* Full Height Character Image - Immersive Style */}
        <motion.img
          src={character.avatarUrl || IMAGES.char.test}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 z-0"
          alt="Character"
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-[#FF9FAA]/0 group-hover:bg-[#FF9FAA]/10 transition-all duration-500 rounded-[2.5rem] z-[5]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C241F] via-[#2C241F]/30 to-transparent opacity-90 z-10" />

        {/* Sparkles */}
        <div className="absolute top-10 right-8 animate-pulse z-20">
           <Sparkles className="text-[#FFD166]" size={24} fill="currentColor" />
        </div>
        
        {/* Bottom Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
           <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-3xl font-black text-white leading-none mb-2 drop-shadow-md">{character.name}</h2>
                <span className="bg-white/20 backdrop-blur-md text-[#FFD166] text-xs px-3 py-1 rounded-full font-bold tracking-wider border border-white/10 shadow-sm">
                  {CLASS_LABELS[character.classType]}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Level</span>
                <span className="text-4xl font-black text-white leading-none drop-shadow-sm">{character.level}</span>
              </div>
           </div>

           {/* Bars */}
           <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-white/90">
                 <span className="w-6 text-shadow-sm">HP</span>
                 <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((character.currentHp / character.maxHp) * 100)}%` }}
                      className="h-full bg-[#FF9FAA] rounded-full shadow-[0_0_10px_rgba(255,159,170,0.5)]"
                    />
                 </div>
                 <span className="w-12 text-right font-mono">{character.currentHp}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-white/90">
                 <span className="w-6 text-shadow-sm">MP</span>
                 <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((character.currentMp / character.maxMp) * 100)}%` }}
                      className="h-full bg-[#89CFF0] rounded-full shadow-[0_0_10px_rgba(137,207,240,0.5)]"
                    />
                 </div>
                 <span className="w-12 text-right font-mono">{character.currentMp}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-white/90">
                 <span className="w-6 text-shadow-sm">AP</span>
                 <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((character.currentAP / character.maxAP) * 100)}%` }}
                      className="h-full bg-[#FFB74D] rounded-full shadow-[0_0_10px_rgba(255,183,77,0.5)]"
                    />
                 </div>
                 <span className="w-12 text-right font-mono">{character.currentAP}</span>
              </div>
           </div>

           {/* Stats Section - Pure Values */}
           <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-center gap-2">
                 <div className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-red-400/30 shadow-lg">
                    <span className="text-red-300 text-sm">⚔️</span>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">攻击力</span>
                    <span className="text-xl font-black text-white drop-shadow-md">{calculateAttackPower(character)}</span>
                 </div>
              </div>
           </div>
        </div>
     </div>
);

// --- Sub-Components ---

const CornerDecor = ({ className }: { className?: string }) => (
  <svg className={`absolute w-3 h-3 pointer-events-none ${className}`} viewBox="0 0 10 10" fill="currentColor">
    <path d="M0 0 H10 V2 H2 V10 H0 Z" />
  </svg>
);

const RestaurantSheet = ({ gold, onPurchase }: { gold: number; onPurchase: (key: keyof typeof ALL_ITEMS, price: number) => void }) => {
  return (
    <div className="h-full flex flex-col bg-[#FFFBF0]">
      <div className="px-4 pr-16 py-4 md:px-6 md:pr-20 md:py-6 border-b border-[#E6D7C3] flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-[#FF9FAA] text-white p-2.5 md:p-3 rounded-2xl shadow-md">
            <Utensils size={32} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-[#5D4037] leading-tight">酒馆餐厅</h2>
            <p className="text-[#8B7355] font-bold text-xs md:text-sm mt-0.5">热食与小酌</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end md:items-end mt-2 md:mt-0">
          <div className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wide">Gold</div>
          <div className="text-lg md:text-2xl font-black text-[#FFD166] flex items-baseline gap-1">
            <span className="font-mono">{gold}</span>
            <span className="text-[10px] md:text-xs text-[#8B7355]">G</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {RESTAURANT_ITEMS.map(({ key, price }) => {
            const item = ALL_ITEMS[key];
            const affordable = gold >= price;
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl border-2 border-[#F0EAE0] shadow-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#FFF7E0] flex items-center justify-center">
                    <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-[#5D4037] truncate">{item.name}</h3>
                    <p className="text-xs text-[#8B7355] line-clamp-2">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="px-3 py-1 bg-[#FFD166]/30 text-[#C27B28] rounded-full text-xs font-bold">
                    {price} G
                  </span>
                  <button
                    onClick={() => onPurchase(key, price)}
                    disabled={!affordable}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all ${
                      affordable
                        ? 'bg-[#5D4037] text-white hover:bg-[#FF9FAA]'
                        : 'bg-[#E6D7C3] text-[#8B7355] cursor-not-allowed opacity-70'
                    }`}
                  >
                    {affordable ? '点这道菜' : '金币不足'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group bg-white/80 hover:bg-white text-[#5D4037] hover:text-[#FF9FAA] px-1.5 py-1 md:px-2.5 md:py-2 rounded-lg md:rounded-xl border border-white shadow-sm transition-all active:scale-95 flex items-center gap-1 md:gap-1.5 shrink-0"
    title={label}
  >
    {icon}
    <span className="hidden xl:inline text-xs font-bold">{label}</span>
  </button>
);

const InventorySheet = ({ items, onUseItem }: { items: Item[]; onUseItem: (itemId: string, itemName: string) => void }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleUse = (itemId: string, itemName: string) => {
    setSelectedItem(null);
    setShowDetail(false);
    onUseItem(itemId, itemName);
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFBF0]">
       <div className="p-8 pb-4 border-b border-[#E6D7C3] flex items-center gap-4">
          <div className="bg-[#FFD166] text-white p-3 rounded-2xl shadow-md">
             <Backpack size={32} />
          </div>
          <div>
             <h2 className="text-3xl font-serif font-black text-[#5D4037]">行囊</h2>
             <p className="text-[#8B7355] font-bold text-sm">Inventory</p>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
             {items.map(item => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white p-4 rounded-2xl border-2 border-[#F0EAE0] hover:border-[#FF9FAA] hover:shadow-lg transition-all group cursor-pointer text-center relative overflow-hidden flex flex-col items-center justify-between h-[160px]"
                >
                   <div className="flex-1 flex items-center justify-center w-full relative">
                      <div className="relative w-16 h-16 group-hover:scale-110 transition-transform duration-300">
                        <img
                          src={item.icon}
                          alt={item.name}
                          className="w-full h-full object-contain drop-shadow-sm"
                        />
                      </div>
                   </div>

                   <div className="w-full mt-2">
                      <div className="text-sm font-bold text-[#5D4037] truncate w-full">{item.name}</div>
                      <div className="text-[10px] text-[#8B7355] mt-0.5">{item.type}</div>
                   </div>

                   <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      item.rarity === 'Legendary' ? 'bg-purple-400' :
                      item.rarity === 'Rare' ? 'bg-blue-400' : 'bg-gray-300'
                   }`} />

                   {/* Quantity badge for consumables */}
                   {item.type === 'Consumable' && item.quantity && (
                     <div className="absolute bottom-2 right-2 bg-[#5D4037] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                       ×{item.quantity}
                     </div>
                   )}
                </motion.div>
             ))}
          </div>
       </div>

       {/* Item Action Menu */}
       <AnimatePresence>
         {selectedItem && !showDetail && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50"
             onClick={() => setSelectedItem(null)}
           >
             <motion.div
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 100, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-white w-full md:w-auto md:min-w-[400px] rounded-t-3xl md:rounded-3xl p-6 shadow-2xl"
             >
               <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[#E6D7C3]">
                 <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                   <img src={selectedItem.icon} alt={selectedItem.name} className="w-12 h-12 object-contain" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h3 className="text-xl font-bold text-[#5D4037] truncate">{selectedItem.name}</h3>
                   <p className="text-sm text-[#8B7355]">{selectedItem.type}</p>
                 </div>
               </div>

               <div className="flex gap-3">
                 <button
                   onClick={() => setShowDetail(true)}
                   className="flex-1 py-3 px-4 bg-[#89CFF0] hover:bg-[#7AB8D8] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                   <span>📖</span> 查看详情
                 </button>
                 <button
                   onClick={() => handleUse(selectedItem.id, selectedItem.name)}
                   className="flex-1 py-3 px-4 bg-[#FF9FAA] hover:bg-[#FF8A9B] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                   <Sparkles size={18} /> 使用
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Item Detail Modal */}
       <AnimatePresence>
         {selectedItem && showDetail && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={() => setShowDetail(false)}
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-[#FFFBF0] w-full max-w-md rounded-3xl p-8 shadow-2xl border-4 border-white relative"
             >
               <button
                 onClick={() => setShowDetail(false)}
                 className="absolute top-4 right-4 w-8 h-8 bg-[#E6D7C3] hover:bg-[#D4C5B0] rounded-full flex items-center justify-center transition-colors"
               >
                 <X size={16} />
               </button>

               <div className="flex flex-col items-center mb-6">
                 <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-4 relative ${
                   selectedItem.rarity === 'Legendary' ? 'bg-gradient-to-br from-purple-200 to-purple-100' :
                   selectedItem.rarity === 'Rare' ? 'bg-gradient-to-br from-blue-200 to-blue-100' :
                   'bg-gradient-to-br from-gray-200 to-gray-100'
                 }`}>
                   <img src={selectedItem.icon} alt={selectedItem.name} className="w-20 h-20 object-contain" />
                   {/* Quantity badge */}
                   {selectedItem.type === 'Consumable' && selectedItem.quantity && (
                     <div className="absolute bottom-1 right-1 bg-[#5D4037] text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                       ×{selectedItem.quantity}
                     </div>
                   )}
                 </div>
                 <h2 className="text-2xl font-black text-[#5D4037] mb-2">{selectedItem.name}</h2>
                 <div className="flex gap-2">
                   <span className="px-3 py-1 bg-[#E6D7C3] text-[#5D4037] text-xs font-bold rounded-full">
                     {selectedItem.type}
                   </span>
                   <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                     selectedItem.rarity === 'Legendary' ? 'bg-purple-100 text-purple-700' :
                     selectedItem.rarity === 'Rare' ? 'bg-blue-100 text-blue-700' :
                     'bg-gray-100 text-gray-700'
                   }`}>
                     {selectedItem.rarity}
                   </span>
                   {/* Show quantity in tag for consumables */}
                   {selectedItem.type === 'Consumable' && selectedItem.quantity && (
                     <span className="px-3 py-1 bg-[#FFD166] text-[#5D4037] text-xs font-bold rounded-full">
                       数量: {selectedItem.quantity}
                     </span>
                   )}
                 </div>
               </div>

               <div className="bg-white p-4 rounded-xl border-2 border-[#F0EAE0] mb-6">
                 <p className="text-[#5D4037] leading-relaxed">{selectedItem.description}</p>
               </div>

               {/* Stat bonuses preview (if any) */}
               {selectedItem.statBonus && (
                 <div className="bg-white p-4 rounded-xl border-2 border-[#E6D7C3] mb-6">
                   <div className="text-sm font-bold text-[#5D4037] mb-2">属性加成</div>
                   <div className="flex flex-wrap gap-2">
                     {(['STR', 'DEX', 'INT', 'CHA', 'LUCK'] as Array<keyof CharacterStats>)
                       .map(key => {
                         const value = selectedItem.statBonus?.[key] ?? 0;
                         if (!value) return null;

                         const labelMap: Record<keyof CharacterStats, string> = {
                           STR: '力量',
                           DEX: '敏捷',
                           INT: '智力',
                           CHA: '魅力',
                           LUCK: '幸运',
                         };

                         const isPositive = value > 0;
                         const sign = value > 0 ? '+' : '';

                         return (
                           <span
                             key={key}
                             className={`px-3 py-1 rounded-full text-xs font-bold border ${
                               isPositive
                                 ? 'bg-green-50 text-green-700 border-green-200'
                                 : 'bg-red-50 text-red-700 border-red-200'
                             }`}
                           >
                             {labelMap[key]} {sign}{value}
                           </span>
                         );
                       })}
                   </div>
                 </div>
               )}

               <div className="flex gap-3">
                 <button
                   onClick={() => setShowDetail(false)}
                   className="flex-1 py-3 px-4 bg-[#E6D7C3] hover:bg-[#D4C5B0] text-[#5D4037] font-bold rounded-xl transition-colors"
                 >
                   返回
                 </button>
                 <button
                   onClick={() => handleUse(selectedItem.id, selectedItem.name)}
                   className="flex-1 py-3 px-4 bg-[#FF9FAA] hover:bg-[#FF8A9B] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                   <Sparkles size={18} /> 使用
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

const StatusSheet = ({ character }: { character: Character }) => {
    const statsData = Object.keys(character.stats).map(key => ({
    subject: key,
    A: character.stats[key as keyof typeof character.stats],
    fullMark: 15,
  }));

  return (
    <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
       <div className="w-full md:w-5/12 bg-[#F7F2E8] p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-[#E6D7C3] relative shrink-0">
          <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-xl overflow-hidden mb-6 relative z-10">
             <img src={character.avatarUrl || IMAGES.char.test} className="w-full h-full object-cover" alt="Portrait"/>
          </div>
          <h2 className="text-3xl font-serif font-black text-[#5D4037] mb-1 text-center">{character.name}</h2>
          <div className="text-[#FF9FAA] font-bold mb-8 uppercase tracking-widest text-xs bg-[#5D4037] px-3 py-1 rounded-full">
             {CLASS_LABELS[character.classType]}
          </div>
          
          <div className="w-full space-y-4">
             <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] shadow-sm flex items-center justify-between">
                <span className="font-bold text-[#8B7355] text-xs uppercase">Level</span>
                <span className="font-black text-2xl text-[#5D4037]">{character.level}</span>
             </div>

             {/* EXP Progress Bar */}
             <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                   <span className="font-bold text-[#8B7355] text-xs uppercase">Experience</span>
                   <span className="font-bold text-xs text-[#5D4037]">{character.exp} / 100</span>
                </div>
                <div className="w-full h-2 bg-[#F0EAE0] rounded-full overflow-hidden">
                   <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${getExpProgress(character.exp, character.level)}%` }}
                     transition={{ duration: 0.5, ease: "easeOut" }}
                     className="h-full bg-gradient-to-r from-[#89CFF0] to-[#6BA8D8] rounded-full shadow-sm"
                   />
                </div>
             </div>

             <div className="bg-white p-3 rounded-xl border border-[#E6D7C3] shadow-sm flex items-center justify-between">
                <span className="font-bold text-[#8B7355] text-xs uppercase">Gold</span>
                <span className="font-black text-xl text-[#FFD166] flex items-center gap-1">
                   {character.gold} <span className="text-xs text-[#8B7355]">G</span>
                </span>
             </div>
          </div>
       </div>

       <div className="flex-1 p-8 bg-white flex flex-col">
           <h3 className="text-xl font-bold text-[#5D4037] mb-6 flex items-center gap-2">
             <Star className="text-[#FFD166] fill-current" /> 战斗参数
           </h3>
           <div className="flex-1 min-h-[300px] bg-[#FFFBF0] rounded-3xl p-4 border border-[#F0EAE0]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={statsData}>
                  <PolarGrid stroke="#E6D7C3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B7355', fontSize: 12, fontWeight: 'bold' }} />
                  <Radar name="Stats" dataKey="A" stroke="#FF9FAA" strokeWidth={3} fill="#FF9FAA" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
           </div>
       </div>
    </div>
  )
};

const GuildSheet = ({ character, onAcceptQuest }: { character: Character; onAcceptQuest: (questId: string, questTitle: string) => void }) => {
  const availableQuests = getAvailableQuests(character.activeQuests, character.completedQuests);
  const activeQuests = getActiveQuests(character.activeQuests);
  const completedQuests = getCompletedQuests(character.completedQuests);

  return (
    <div className="h-full flex flex-col bg-[#FFFBF0]">
      <div className="p-8 pb-4 border-b border-[#E6D7C3] flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-[#89CFF0] text-white p-3 rounded-2xl shadow-md">
               <ShieldCheck size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-serif font-black text-[#5D4037]">公会委托</h2>
               <p className="text-[#8B7355] font-bold text-sm">Quests</p>
            </div>
         </div>
         <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-[#8B7355] uppercase">Rank</div>
            <div className="text-2xl font-black text-[#5D4037]">B-Rank</div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
         <div className="space-y-4">
            {/* Available Quests */}
            {availableQuests.map(quest => (
              <div key={quest.id} className={`bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center ${
                quest.rarity === 'Urgent' ? 'border-l-8 border-[#FF9FAA]' :
                quest.rarity === 'Rare' ? 'border-l-8 border-[#89CFF0]' :
                'border-l-8 border-[#FFD166]'
              }`}>
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       {quest.rarity === 'Urgent' && <span className="bg-[#FF9FAA]/10 text-[#FF9FAA] text-[10px] font-bold px-2 py-1 rounded-full border border-[#FF9FAA]/20">紧急</span>}
                       {quest.rarity === 'Rare' && <span className="bg-[#89CFF0]/10 text-[#89CFF0] text-[10px] font-bold px-2 py-1 rounded-full border border-[#89CFF0]/20">稀有</span>}
                       <h3 className="font-bold text-lg text-[#5D4037]">{quest.title}</h3>
                    </div>
                    <p className="text-sm text-[#8B7355] leading-relaxed">
                       {quest.description}
                    </p>
                 </div>
                 <div className="flex flex-row md:flex-col items-center gap-4 md:gap-1 min-w-[100px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between">
                    <div className="text-[#5D4037] font-black text-lg">{quest.reward} G</div>
                    <button
                      onClick={() => onAcceptQuest(quest.id, quest.title)}
                      className="bg-[#5D4037] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#FF9FAA] transition-colors active:scale-95"
                    >
                       接受
                    </button>
                 </div>
              </div>
            ))}

            {/* Active Quests */}
            {activeQuests.map(quest => (
              <div key={quest.id} className="bg-[#FFF9F0] p-6 rounded-2xl border-l-8 border-[#FFD166] shadow-sm">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="font-bold text-lg text-[#5D4037]">{quest.title}</h3>
                     <span className="text-[#FFD166] font-bold text-sm flex items-center gap-1">
                        ⏳ 进行中
                     </span>
                 </div>
                 <p className="text-sm text-[#8B7355]">
                    {quest.description}
                 </p>
              </div>
            ))}

            {/* Completed Quests */}
            {completedQuests.map(quest => (
              <div key={quest.id} className="bg-white p-6 rounded-2xl border-l-8 border-gray-300 shadow-sm opacity-60">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="font-bold text-lg text-[#5D4037] line-through">{quest.title}</h3>
                     <span className="text-green-500 font-bold text-sm flex items-center gap-1">
                        <CheckCircleIcon /> 已完成
                     </span>
                 </div>
                 <p className="text-sm text-[#8B7355]">
                    {quest.description}
                 </p>
              </div>
            ))}

            {availableQuests.length === 0 && activeQuests.length === 0 && completedQuests.length === 0 && (
              <div className="text-center py-12 text-[#D4C5B0]">
                <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold">暂无可用任务</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

const ShopSheet = ({ shopState, gold, onRefresh, onPurchase, onPurchasePotion }: { shopState: ShopState; gold: number; onRefresh: () => void; onPurchase: () => void; onPurchasePotion: (key: keyof typeof ALL_ITEMS, price: number) => void }) => {
  const currentItem = shopState.currentItemKey ? ALL_ITEMS[shopState.currentItemKey as keyof typeof ALL_ITEMS] : null;
  const soldOut = shopState.purchasedKeys?.length >= LEGENDARY_SHOP_ITEMS.length;

  return (
    <div className="h-full flex flex-col bg-[#FFFBF0]">
      <div className="p-6 pb-4 border-b border-[#E6D7C3] flex items-center gap-4">
        <div className="bg-[#FFD166] text-white p-3 rounded-2xl shadow-md">
          <ShoppingBag size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-serif font-black text-[#5D4037]">万宝阁</h2>
          <p className="text-[#8B7355] font-bold text-sm">Legendary Relics</p>
        </div>
      </div>

      {/* Scrollable content area for mobile，避免战斗补给卡片撑掉下方传奇物品 */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {/* Battle Potions Section */}
        <div className="bg-white rounded-2xl border-2 border-[#F0EAE0] shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-black text-[#5D4037]">战斗补给</h3>
              <p className="text-xs text-[#8B7355] font-bold">治愈药水 / 秘药：灵能酿</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wide">Gold</div>
              <div className="text-lg font-black text-[#FFD166] flex items-baseline gap-1">
                <span className="font-mono">{gold}</span>
                <span className="text-[10px] text-[#8B7355]">G</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHOP_POTION_ITEMS.map(({ key, price }) => {
              const item = ALL_ITEMS[key];
              const affordable = gold >= price;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between bg-[#FFFBF0] rounded-xl border border-[#F0EAE0] px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FFF7E0] flex items-center justify-center">
                      <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#5D4037]">{item.name}</div>
                      <div className="text-[10px] text-[#8B7355] line-clamp-2">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 bg-[#FFD166]/30 text-[#C27B28] rounded-full text-[10px] font-bold">
                      {price} G
                    </span>
                    <button
                      onClick={() => onPurchasePotion(key, price)}
                      disabled={!affordable}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition-all ${
                        affordable
                          ? 'bg-[#5D4037] text-white hover:bg-[#FF9FAA]'
                          : 'bg-[#E6D7C3] text-[#8B7355] cursor-not-allowed opacity-70'
                      }`}
                    >
                      {affordable ? '购买药水' : '金币不足'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legendary Relics Section */}
        {!soldOut && currentItem && (
          <div className="bg-white rounded-2xl border-2 border-[#F0EAE0] shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#FFEBB8] to-[#FFE2E2] rounded-2xl flex items-center justify-center">
              <img src={currentItem.icon} alt={currentItem.name} className="w-16 h-16 object-contain" />
              <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">传奇</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-[#5D4037] mb-1">{currentItem.name}</h3>
              <p className="text-sm text-[#8B7355] mb-2 leading-relaxed line-clamp-3">{currentItem.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#5D4037] font-bold">
                <span className="px-3 py-1 bg-[#FFD166]/30 text-[#C27B28] rounded-full border border-[#FFD166]/50 whitespace-nowrap">价格：{LEGENDARY_SHOP_PRICE} G</span>
                <span className="px-3 py-1 bg-[#E6D7C3]/60 text-[#5D4037] rounded-full whitespace-nowrap">持有：{gold} G</span>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  onPurchase();
                  onRefresh();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#5D4037] text-white font-bold shadow-md active:scale-95 transition-all hover:bg-[#FF9FAA]"
              >
                购买
              </button>
              <button
                onClick={onRefresh}
                className="px-5 py-2 rounded-xl bg-white text-[#5D4037] font-bold border border-[#E6D7C3] hover:border-[#5D4037]/30 transition-colors"
              >
                刷新货架（每小时轮换）
              </button>
            </div>
          </div>
        )}

        {!soldOut && !currentItem && (
          <div className="text-center text-[#8B7355] bg-white rounded-2xl border border-dashed border-[#E6D7C3] p-6">
            <p className="font-bold mb-1">本时段宝物已售空</p>
            <p className="text-sm">等待下次补货或手动刷新</p>
          </div>
        )}

        {soldOut && (
          <div className="text-center text-[#8B7355] bg-white rounded-2xl border border-[#E6D7C3] p-6 space-y-2">
            <p className="font-bold text-lg text-[#5D4037]">全部售罄！</p>
            <p className="text-sm">所有传奇宝物已售出，可前往“荣誉墙”查看并领取成就奖励。</p>
          </div>
        )}
      </div>
    </div>
  );
};

const HonorWall = ({ shopState, onClaim }: { shopState: ShopState; onClaim: () => boolean }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const owned = (key: string) => shopState.purchasedKeys?.includes(key);

  const selectedItem = selectedKey ? ALL_ITEMS[selectedKey as keyof typeof ALL_ITEMS] : null;
  const allCollected = shopState.purchasedKeys?.length >= LEGENDARY_SHOP_ITEMS.length;

  return (
    <div className="h-full flex flex-col bg-[#FFFBF0]">
      <div className="p-8 pb-4 border-b border-[#E6D7C3] flex items-center gap-4">
        <div className="bg-[#C27B28] text-white p-3 rounded-2xl shadow-md">
          <Crown size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-serif font-black text-[#5D4037]">荣誉墙</h2>
          <p className="text-[#8B7355] font-bold text-sm">传奇宝物收集</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[#5D4037] font-bold">已收集 {shopState.purchasedKeys?.length || 0} / {LEGENDARY_SHOP_ITEMS.length}</span>
          {allCollected && !shopState.achievementClaimed && (
            <button
              onClick={() => {
                const ok = onClaim();
                if (!ok) {
                  alert('无法领取，请检查条件');
                } else {
                  alert('已获得「霸主之证」，请在背包查看');
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#5D4037] text-white text-sm font-bold shadow-sm hover:bg-[#FF9FAA] transition-colors"
            >
              领取霸主之证
            </button>
          )}
          {shopState.achievementClaimed && (
            <span className="text-xs text-green-600 font-bold">霸主之证已领取</span>
          )}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {LEGENDARY_SHOP_ITEMS.map((key) => {
            const item = ALL_ITEMS[key as keyof typeof ALL_ITEMS];
            return (
              <div
                key={key}
                className={`w-full aspect-square rounded-xl border flex items-center justify-center shadow-sm ${
                  owned(key)
                    ? 'bg-gradient-to-br from-purple-100 to-purple-50 border-[#E6D7C3]'
                    : 'bg-white border-dashed border-[#E6D7C3] opacity-60'
                }`}
                onClick={() => {
                  if (!owned(key)) {
                    alert('尚未解锁，无法查看');
                    return;
                  }
                  setSelectedKey(key);
                }}
              >
                {item && <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedKey(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-4 border-white relative"
            >
              <button
                onClick={() => setSelectedKey(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-[#E6D7C3] hover:bg-[#D4C5B0] rounded-full flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center border border-[#E6D7C3] shadow-inner">
                  <img src={selectedItem.icon} alt={selectedItem.name} className="w-16 h-16 object-contain" />
                </div>
                <h3 className="text-2xl font-black text-[#5D4037]">{selectedItem.name}</h3>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">传奇</span>
                <p className="text-sm text-[#8B7355] leading-relaxed">{selectedItem.description}</p>

                {/* Stat bonuses preview (if any) */}
                {'statBonus' in selectedItem && selectedItem.statBonus && (
                  <div className="mt-2 bg-[#FFFBF0] border border-[#E6D7C3] rounded-2xl px-3 py-2 w-full max-w-xs">
                    <div className="text-xs font-bold text-[#5D4037] mb-1">属性加成</div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {(['STR', 'DEX', 'INT', 'CHA', 'LUCK'] as Array<keyof CharacterStats>).map(key => {
                        const value = ('statBonus' in selectedItem && selectedItem.statBonus?.[key]) ?? 0;
                        if (!value) return null;

                        const labelMap: Record<keyof CharacterStats, string> = {
                          STR: '力量',
                          DEX: '敏捷',
                          INT: '智力',
                          CHA: '魅力',
                          LUCK: '幸运',
                        };

                        const isPositive = value > 0;
                        const sign = value > 0 ? '+' : '';

                        return (
                          <span
                            key={key}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isPositive
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {labelMap[key]} {sign}{value}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MapSheet = ({ location, onSelect }: { location: string; onSelect: (loc: string) => void }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Find current node by location name
  const currentNode = MAP_GRAPH.nodes.find(n => n.name === location);

  // Calculate reachable node IDs from current location
  const reachableIds = currentNode
    ? MAP_GRAPH.edges
        .filter(edge => edge.includes(currentNode.id))
        .flat()
        .filter(id => id !== currentNode.id)
    : [];

  // Calculate node SVG position based on row/col
  const getNodePosition = (row: number, col: number) => ({
    x: 100 + (col - 1) * 300,
    y: 100 + (row - 1) * 200,
  });

  // Get node visual state
  const getNodeState = (nodeId: string) => {
    if (currentNode?.id === nodeId) return 'current';
    if (reachableIds.includes(nodeId)) return 'reachable';
    return 'unreachable';
  };

  // Get edge visual state
  const getEdgeState = (edge: string[]) => {
    if (!currentNode) return 'normal';
    if (edge.includes(currentNode.id)) return 'highlighted';
    return 'normal';
  };

  return (
    <div className="h-full flex flex-col bg-[#FFFBF0]">
      {/* Header */}
      <div className="p-6 md:p-8 pb-4 border-b border-[#E6D7C3] flex items-center gap-4">
        <div className="bg-[#89CFF0] text-white p-2.5 rounded-xl shadow-md">
          <MapPin size={24} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-black text-[#5D4037]">前往何处</h2>
          <p className="text-[#8B7355] font-bold text-xs">点击相邻地点即可前往</p>
        </div>
      </div>

      {/* SVG Node Graph */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="w-full h-full max-w-4xl flex items-center justify-center relative">
          {/* Parchment background with radial gradient */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, #FFF9E6 0%, #F5E6D3 50%, #E8D4B8 100%)',
                opacity: 0.8
              }}
            />
            {/* Subtle grid pattern overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8B7355" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <svg viewBox="0 0 800 600" className="w-full h-full relative z-10" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            {/* Define gradients and filters */}
            <defs>
              {/* Current node: Golden gem gradient */}
              <radialGradient id="currentNodeGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#FFF4D6" />
                <stop offset="40%" stopColor="#FFD166" />
                <stop offset="100%" stopColor="#C27B28" />
              </radialGradient>

              {/* Current node glow (stronger) */}
              <radialGradient id="currentGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFD166" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#FFD166" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
              </radialGradient>

              {/* Reachable node: Bronze/silver gradient */}
              <radialGradient id="reachableNodeGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#E8F4F8" />
                <stop offset="40%" stopColor="#A8D5E2" />
                <stop offset="100%" stopColor="#6FA8B8" />
              </radialGradient>

              {/* Reachable node hover: Enhanced glow */}
              <radialGradient id="reachableHoverGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#C4E8F5" />
                <stop offset="100%" stopColor="#89CFF0" />
              </radialGradient>

              {/* Unreachable node: Stone gray */}
              <radialGradient id="unreachableNodeGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#E0E0E0" />
                <stop offset="40%" stopColor="#B8B8B8" />
                <stop offset="100%" stopColor="#8A8A8A" />
              </radialGradient>

              {/* Drop shadow for depth */}
              <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Outer glow for emphasis */}
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Animated dashed line for current path */}
              <style>
                {`
                  @keyframes dash-flow {
                    to { stroke-dashoffset: -40; }
                  }
                  .flow-path {
                    animation: dash-flow 1.5s linear infinite;
                  }
                `}
              </style>
            </defs>

            {/* Render edges (connections) with dashed style */}
            {MAP_GRAPH.edges.map((edge, i) => {
              const [fromId, toId] = edge;
              const fromNode = MAP_GRAPH.nodes.find(n => n.id === fromId);
              const toNode = MAP_GRAPH.nodes.find(n => n.id === toId);
              if (!fromNode || !toNode) return null;

              const fromPos = getNodePosition(fromNode.row, fromNode.col);
              const toPos = getNodePosition(toNode.row, toNode.col);
              const edgeState = getEdgeState(edge);

              return (
                <line
                  key={`edge-${i}`}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={edgeState === 'highlighted' ? '#D4A574' : '#A8D5E2'}
                  strokeWidth={edgeState === 'highlighted' ? 3 : 2}
                  strokeOpacity={edgeState === 'highlighted' ? 0.85 : 0.35}
                  strokeLinecap="round"
                  strokeDasharray={edgeState === 'highlighted' ? '10 5' : '8 4'}
                  className={edgeState === 'highlighted' ? 'flow-path' : ''}
                />
              );
            })}

            {/* Render nodes */}
            {MAP_GRAPH.nodes.map(node => {
              const pos = getNodePosition(node.row, node.col);
              const state = getNodeState(node.id);
              const isHovered = hoveredNode === node.id;
              const canClick = state === 'current' || state === 'reachable';

              // Node gradient fills based on state
              const nodeFill =
                state === 'current' ? 'url(#currentNodeGradient)' :
                state === 'reachable' ? (isHovered ? 'url(#reachableHoverGradient)' : 'url(#reachableNodeGradient)') :
                'url(#unreachableNodeGradient)';

              const strokeColor =
                state === 'current' ? '#B8860B' :
                state === 'reachable' ? '#5A9FB0' :
                '#7A7A7A';

              const strokeWidth =
                state === 'current' ? 3 :
                state === 'reachable' ? 2.5 : 1.5;

              return (
                <g
                  key={node.id}
                  style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    transformOrigin: 'center'
                  }}
                >
                  {/* Glow effect for current location */}
                  {state === 'current' && (
                    <circle
                      cx="0"
                      cy="0"
                      r="80"
                      fill="url(#currentGlow)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Outer glow for hovered reachable nodes */}
                  {isHovered && state === 'reachable' && (
                    <circle
                      cx="0"
                      cy="0"
                      r="65"
                      fill="none"
                      stroke="#89CFF0"
                      strokeWidth="8"
                      opacity="0.3"
                      filter="url(#nodeGlow)"
                    />
                  )}

                  {/* Node circle with gradient fill */}
                  <circle
                    cx="0"
                    cy="0"
                    r="50"
                    fill={nodeFill}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={state === 'unreachable' ? 0.55 : 1}
                    filter="url(#nodeShadow)"
                    className={canClick ? 'cursor-pointer' : 'cursor-not-allowed'}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => {
                      if (canClick && state !== 'current') {
                        onSelect(node.name);
                      }
                    }}
                  />

                  {/* Inner highlight for gem effect */}
                  <circle
                    cx="-10"
                    cy="-10"
                    r="15"
                    fill="#FFFFFF"
                    opacity={state === 'unreachable' ? 0.1 : 0.25}
                    className="pointer-events-none"
                  />

                  {/* Node label (short name) */}
                  <text
                    x="0"
                    y="6"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill="#5D4037"
                    className={`pointer-events-none select-none ${
                      state === 'unreachable' ? 'opacity-60' : ''
                    }`}
                    style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
                  >
                    {MAP_SHORT_NAMES[node.id]}
                  </text>

                  {/* Current location indicator */}
                  {state === 'current' && (
                    <text
                      x="0"
                      y="75"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#C27B28"
                      className="pointer-events-none"
                      style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}
                    >
                      当前位置
                    </text>
                  )}
                </g>
              );
            })}

            {/* Hover tooltip layer (rendered on top, outside node groups) */}
            {hoveredNode && (() => {
              const node = MAP_GRAPH.nodes.find(n => n.id === hoveredNode);
              const state = getNodeState(hoveredNode);
              if (!node || state === 'unreachable') return null;

              const pos = getNodePosition(node.row, node.col);
              return (
                <g className="pointer-events-none" key="tooltip">
                  <rect
                    x={pos.x - 120}
                    y={pos.y + 75}
                    width="240"
                    height="65"
                    rx="12"
                    fill="#FFFEF8"
                    stroke="#D4A574"
                    strokeWidth="2"
                    opacity="0.95"
                    filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 98}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="bold"
                    fill="#5D4037"
                  >
                    {node.name}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 118}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#8B7355"
                    fontStyle="italic"
                  >
                    {node.desc}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
};
const CheckCircleIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default GameInterface;
