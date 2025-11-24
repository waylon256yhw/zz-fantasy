/**
 * Combat Sheet Component
 * Main combat interface with character stats, combat log, and action buttons
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Shield, Flag, FlaskConical } from 'lucide-react';
import { Character, CombatState } from '../types';
import { CombatLogDisplay } from './CombatLogDisplay';
import { canPerformAction } from '../src/utils/combatSystem';
import { COMBAT_CONFIG } from '../src/config/combatConfig';

interface CombatSheetProps {
  character: Character;
  combatState: CombatState;
  onAction: (action: 'attack' | 'defend' | 'retreat' | 'encounter' | 'skip' | 'useHealPotion' | 'useArcaneTonic') => void;
}

export const CombatSheet: React.FC<CombatSheetProps> = ({
  character,
  combatState,
  onAction,
}) => {
  const { isInCombat, currentEnemy, combatLogs, currentTurn, maxTurns, isPlayerStunned, enemyNextAction } =
    combatState;

  const [showPotionPanel, setShowPotionPanel] = useState(false);

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
          {Object.entries(character.stats).map(([key, value]) => (
            <div key={key} className="bg-white border border-[#E6D7C3] rounded-lg px-2 py-1 text-center">
              <div className="text-xs text-[#8B7355] font-bold">{key}</div>
              <div className="text-lg font-bold text-[#5D4037]">{value}</div>
            </div>
          ))}
        </div>

        {/* Enemy Info Card (when in combat) */}
        {isInCombat && currentEnemy && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-red-50 border-2 border-red-300 rounded-xl p-2.5 shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm text-red-900 font-bold">
                  [{currentEnemy.rank}级] {currentEnemy.name}
                  {currentEnemy.isTreasureMonster && ' ✨'}
                </div>
                <div className="text-xs text-red-700">Lv.{currentEnemy.level}</div>
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
          // Not in combat: Encounter button
          <button
            onClick={() => onAction('encounter')}
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
