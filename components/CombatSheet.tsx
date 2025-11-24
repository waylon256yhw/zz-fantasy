/**
 * Combat Sheet Component
 * Main combat interface with character stats, combat log, and action buttons
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Shield, Flag, FlaskConical } from 'lucide-react';
import { Character, CharacterStats, CombatState } from '../types';
import { CombatLogDisplay } from './CombatLogDisplay';
import { canPerformAction } from '../src/utils/combatSystem';
import { COMBAT_CONFIG } from '../src/config/combatConfig';
import { getRegionByLocation } from '../src/config/worldRegions';
import { getTargetEnemyLevel } from '../src/utils/enemySystem';

interface CombatSheetProps {
  character: Character;
  combatState: CombatState;
  location: string;
  onAction: (action: 'attack' | 'defend' | 'retreat' | 'encounter' | 'skip' | 'useHealPotion' | 'useArcaneTonic') => void;
}

export const CombatSheet: React.FC<CombatSheetProps> = ({
  character,
  combatState,
  location,
  onAction,
}) => {
  const { isInCombat, currentEnemy, combatLogs, currentTurn, maxTurns, isPlayerStunned, enemyNextAction } =
    combatState;

  const [showPotionPanel, setShowPotionPanel] = useState(false);

  // Phase 2: Handle encounter with risk assessment
  const handleEncounterClick = () => {
    const region = getRegionByLocation(location);
    if (!region) {
      // No region config, proceed normally
      onAction('encounter');
      return;
    }

    // Calculate expected enemy level
    const expectedLevel = getTargetEnemyLevel(region, character.level);
    const levelDiff = expectedLevel - character.level;
    const dangerThreshold = 4;

    // High danger: show confirmation
    if (levelDiff >= dangerThreshold) {
      const confirmed = window.confirm(
        `⚠️ 警告\n\n你的直觉告诉你这里的敌人远远强于现在的你（预估等级 ${expectedLevel} 级以上），确定要发起遭遇战吗？\n\n你的等级：${character.level}\n预估敌人：${expectedLevel}\n等级差距：+${levelDiff}`
      );
      if (!confirmed) return;
    } else if (levelDiff >= 2) {
      // Moderate danger: lighter warning
      const confirmed = window.confirm(
        `⚠️ 提示\n\n你感觉这里的魔物比你略强（预估等级 ${expectedLevel} 级），稍有不慎可能失败。\n\n确定要发起遭遇战吗？`
      );
      if (!confirmed) return;
    }

    // Proceed with encounter
    onAction('encounter');
  };

  const hasAnyStatBonus =
    character.statsBonus &&
    Object.values(character.statsBonus).some((v) => v !== 0);

  // 在战斗中且未被击晕、敌人未被击败时，允许攻击 / 防御
  // AP 不足的后果由战斗结算逻辑处理，避免按钮误判导致卡死
  const canAttack = isInCombat && !!currentEnemy && !isPlayerStunned && currentEnemy.currentHp > 0;
  const canDefend = isInCombat && !!currentEnemy && !isPlayerStunned && currentEnemy.currentHp > 0;
  const canRetreat = isInCombat && !!currentEnemy && !isPlayerStunned && currentEnemy.currentHp > 0;
  const canStartEncounter = canPerformAction(character.currentAP, 'encounter');

  const getConsumableCount = (itemName: string) =>
    character.inventory
      .filter(item => item.type === 'Consumable' && item.name === itemName)
      .reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  const healPotionCount = getConsumableCount('治愈药水');
  const tonicCount = getConsumableCount('秘药：灵能酿');
  const hasAnyPotion = healPotionCount > 0 || tonicCount > 0;

  return (
    <div className="h-full flex flex-col bg-[#FFFBF0]">
      {/* Header: Character Stats */}
      <div className="px-4 py-2 md:px-5 md:py-3 border-b border-[#E6D7C3] bg-gradient-to-b from-[#FFF8E7] to-[#FFFBF0]">
        {/* Stats Display (5 stats in a row) */}
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {Object.entries(character.stats).map(([key, value]) => {
            const statKey = key as keyof CharacterStats;
            const bonus = character.statsBonus?.[statKey] ?? 0;
            const hasBonus = hasAnyStatBonus && bonus !== 0;

            return (
              <div
                key={key}
                className="bg-white border border-[#E6D7C3] rounded-lg px-2 py-1 text-center"
              >
                <div className="text-xs text-[#8B7355] font-bold">{key}</div>
                <div className="text-lg font-bold text-[#5D4037]">
                  <span>{value}</span>
                  {hasBonus && (
                    <span
                      className={
                        bonus > 0 ? 'text-green-600 text-xs ml-0.5' : 'text-red-600 text-xs ml-0.5'
                      }
                    >
                      {bonus > 0 ? `(+${bonus})` : `(${bonus})`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enemy Info Card (when in combat) */}
        {isInCombat && currentEnemy && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-red-50 border-2 border-red-300 rounded-xl p-2.5 shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {/* Enemy Icon */}
                {currentEnemy.icon && (
                  <img
                    src={currentEnemy.icon}
                    alt={currentEnemy.name}
                    className="w-12 h-12 rounded-lg border-2 border-red-400 bg-white shadow-sm object-cover"
                  />
                )}
                <div>
                  <div className="text-sm text-red-900 font-bold">
                    [{currentEnemy.rank}级] {currentEnemy.name}
                    {currentEnemy.isTreasureMonster && ' ✨'}
                  </div>
                  <div className="text-xs text-red-700">Lv.{currentEnemy.level}</div>
                  {/* Element and Family Tags */}
                  <div className="flex gap-1 mt-1">
                    {currentEnemy.element && currentEnemy.element !== 'none' && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        currentEnemy.element === 'fire' ? 'bg-orange-200 text-orange-800' :
                        currentEnemy.element === 'ice' ? 'bg-blue-200 text-blue-800' :
                        currentEnemy.element === 'shadow' ? 'bg-purple-200 text-purple-800' :
                        currentEnemy.element === 'nature' ? 'bg-green-200 text-green-800' :
                        currentEnemy.element === 'thunder' ? 'bg-yellow-200 text-yellow-800' :
                        currentEnemy.element === 'holy' ? 'bg-pink-200 text-pink-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {currentEnemy.element === 'fire' ? '🔥' :
                         currentEnemy.element === 'ice' ? '❄️' :
                         currentEnemy.element === 'shadow' ? '🌑' :
                         currentEnemy.element === 'nature' ? '🌿' :
                         currentEnemy.element === 'thunder' ? '⚡' :
                         currentEnemy.element === 'holy' ? '✨' : ''}
                        {currentEnemy.element}
                      </span>
                    )}
                    {currentEnemy.family && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded">
                        {currentEnemy.family}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-red-700 font-bold">
                回合: {currentTurn}/{maxTurns}
              </div>
            </div>

            {/* Enemy HP Bar */}
            <div className="mb-2">
              <div className="h-3 bg-red-200 rounded-full overflow-hidden border border-red-300">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                  style={{ width: `${(currentEnemy.currentHp / currentEnemy.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-right text-xs text-red-700 mt-1">
                HP: {currentEnemy.currentHp}/{currentEnemy.maxHp}
              </div>
            </div>

            {/* Strong Attack Warning */}
            {enemyNextAction === 'STRONG' && !isPlayerStunned && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-yellow-100 border border-yellow-400 rounded-lg px-2 py-1 text-center"
              >
                <span className="text-xs text-yellow-800 font-bold animate-pulse">
                  ⚠️ 敌人正在蓄力强攻击！建议防御！
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Combat Log Area */}
      <div className="flex-1 p-3 md:p-4 overflow-hidden">
        <CombatLogDisplay logs={combatLogs} />
      </div>

      {/* Action Buttons */}
      <div className="p-3 md:p-4 border-t border-[#E6D7C3] bg-white">
        {!isInCombat ? (
          // Not in combat: Encounter button with risk assessment
          <button
            onClick={handleEncounterClick}
            disabled={!canStartEncounter}
            className={`w-full py-3 md:py-3.5 rounded-xl font-bold text-base md:text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              canStartEncounter
                ? 'bg-gradient-to-r from-[#FF9FAA] to-[#FF8A9B] text-white hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Swords size={24} />
            {canStartEncounter ? '⚔️ 发起遭遇战' : `行动点不足 (需要${COMBAT_CONFIG.AP_COST_ENCOUNTER}点)`}
          </button>
        ) : (
          // In combat: Action buttons
          <>
            {isPlayerStunned ? (
              // Player is stunned - click to skip turn
              <button
                onClick={() => onAction('skip')}
                className="w-full bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 text-center hover:bg-yellow-100 transition-all active:scale-98 shadow-md"
              >
                <div className="text-yellow-800 font-bold text-base md:text-lg animate-pulse mb-2">
                  💫 你被击晕了，无法行动！
                </div>
                <div className="text-yellow-700 text-xs md:text-sm">
                  点击跳过回合
                </div>
              </button>
            ) : (
              // Normal action buttons
              <div className="space-y-2 md:space-y-3">
                <div className="grid grid-cols-4 gap-2 md:gap-3">
                  <button
                    onClick={() => onAction('attack')}
                    disabled={!canAttack}
                    className={`py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all active:scale-95 flex flex-col items-center gap-0.5 md:gap-1 shadow-md ${
                      canAttack
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Swords size={20} />
                    <span>攻击</span>
                    <span className="text-xs">(AP-20)</span>
                  </button>

                  <button
                    onClick={() => onAction('defend')}
                    disabled={!canDefend}
                    className={`py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all active:scale-95 flex flex-col items-center gap-0.5 md:gap-1 shadow-md ${
                      canDefend
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Shield size={20} />
                    <span>防御</span>
                    <span className="text-xs">(AP-10)</span>
                  </button>

                  <button
                    onClick={() => onAction('retreat')}
                    disabled={!canRetreat}
                    className={`py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md transition-all active:scale-95 flex flex-col items-center gap-0.5 md:gap-1 ${
                      canRetreat
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Flag size={20} />
                    <span>撤退</span>
                    <span className="text-xs">(成功率)</span>
                  </button>
                  <button
                    onClick={() => hasAnyPotion && setShowPotionPanel(prev => !prev)}
                    disabled={!hasAnyPotion}
                    className={`py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all active:scale-95 flex flex-col items-center gap-0.5 md:gap-1 shadow-md ${
                      hasAnyPotion
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FlaskConical size={20} />
                    <span>喝药</span>
                    <span className="text-[10px]">
                      共 {healPotionCount + tonicCount} 瓶
                    </span>
                  </button>
                </div>

                {showPotionPanel && hasAnyPotion && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onAction('useHealPotion');
                        setShowPotionPanel(false);
                      }}
                      disabled={healPotionCount <= 0}
                      className={`py-1.5 rounded-lg text-[11px] font-bold shadow-sm active:scale-95 transition-all ${
                        healPotionCount > 0
                          ? 'bg-[#FFB74D] text-[#5D4037] hover:bg-[#FFCC80]'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      治愈药水 ×{healPotionCount}
                    </button>
                    <button
                      onClick={() => {
                        onAction('useArcaneTonic');
                        setShowPotionPanel(false);
                      }}
                      disabled={tonicCount <= 0}
                      className={`py-1.5 rounded-lg text-[11px] font-bold shadow-sm active:scale-95 transition-all ${
                        tonicCount > 0
                          ? 'bg-[#7E57C2] text-white hover:bg-[#9575CD]'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      灵能酿 ×{tonicCount}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
