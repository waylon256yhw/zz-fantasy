/**
 * Combat Result Sheet Component
 * Shows battle statistics, rewards, and options after combat ends
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Skull, Flag, Swords, Shield, Coins, Star, ArrowRight, Zap } from 'lucide-react';
import { CombatResult, Character } from '../types';
import { COMBAT_CONFIG } from '../src/config/combatConfig';
import { ALL_ITEMS } from '../constants';

interface CombatResultSheetProps {
  results: CombatResult[];
  character: Character;
  onContinueCombat: () => void;
  onReturnToAdventure: () => void;
}

export const CombatResultSheet: React.FC<CombatResultSheetProps> = ({
  results,
  character,
  onContinueCombat,
  onReturnToAdventure,
}) => {
  const canContinue = character.currentAP >= COMBAT_CONFIG.AP_COST_ENCOUNTER;
  // Calculate totals
  const totals = results.reduce(
    (acc, result) => ({
      gold: acc.gold + result.rewards.gold,
      exp: acc.exp + result.rewards.exp,
      items: [...acc.items, ...(result.rewards.items || []).filter(item => item !== undefined && item !== null)],
      victories: acc.victories + (result.outcome === 'victory' ? 1 : 0),
      defeats: acc.defeats + (result.outcome === 'defeat' ? 1 : 0),
      retreats: acc.retreats + (result.outcome === 'retreat' ? 1 : 0),
      damageDealt: acc.damageDealt + result.playerStats.damageDealt,
      damageTaken: acc.damageTaken + result.playerStats.damageTaken,
    }),
    {
      gold: 0,
      exp: 0,
      items: [] as string[],
      victories: 0,
      defeats: 0,
      retreats: 0,
      damageDealt: 0,
      damageTaken: 0,
    }
  );

  const lastResult = results[results.length - 1];
  const isVictory = lastResult.outcome === 'victory';
  const isDefeat = lastResult.outcome === 'defeat';

  // 堆叠同种战利品，按中文名 + 数量展示
  const lootCounts: Array<{ name: string; count: number }> = React.useMemo(() => {
    const counter: Record<string, number> = {};
    totals.items.filter(key => key !== undefined && key !== null).forEach(key => {
      const def = ALL_ITEMS[key as keyof typeof ALL_ITEMS];
      const name = def ? def.name : key;
      counter[name] = (counter[name] || 0) + 1;
    });
    return Object.entries(counter).map(([name, count]) => ({ name, count }));
  }, [totals.items]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF8E7] to-[#FFFBF0]">
      {/* Header */}
      <div className="px-6 py-4 border-b-2 border-[#E6D7C3]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {isVictory && (
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy size={32} className="text-yellow-500" />
              <h2 className="text-3xl font-serif font-black text-[#5D4037]">战斗胜利！</h2>
              <Trophy size={32} className="text-yellow-500" />
            </div>
          )}
          {isDefeat && (
            <div className="flex items-center justify-center gap-3 mb-2">
              <Skull size={32} className="text-red-500" />
              <h2 className="text-3xl font-serif font-black text-red-700">战斗失败</h2>
              <Skull size={32} className="text-red-500" />
            </div>
          )}
          {lastResult.outcome === 'retreat' && (
            <div className="flex items-center justify-center gap-3 mb-2">
              <Flag size={32} className="text-yellow-600" />
              <h2 className="text-3xl font-serif font-black text-yellow-700">成功撤退</h2>
              <Flag size={32} className="text-yellow-600" />
            </div>
          )}
          <p className="text-sm text-[#8B7355] font-bold">
            {results.length > 1 ? `连续战斗 × ${results.length}` : '战斗结束'}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Enemy Info */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 border-2 border-[#E6D7C3] shadow-md"
        >
          <h3 className="text-lg font-bold text-[#5D4037] mb-3 flex items-center gap-2">
            <Swords size={20} className="text-red-500" />
            最后击败的敌人
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center text-4xl border-2 border-red-300">
              {lastResult.enemy.isTreasureMonster ? '✨' : '👹'}
            </div>
            <div className="flex-1">
              <div className="font-bold text-xl text-[#5D4037]">
                [{lastResult.enemy.rank}级] {lastResult.enemy.name}
              </div>
              <div className="text-sm text-[#8B7355]">Lv.{lastResult.enemy.level}</div>
              <div className="text-xs text-[#8B7355] mt-1">
                耗时 {lastResult.turnsUsed} 回合
              </div>
            </div>
          </div>
        </motion.div>

        {/* Battle Summary */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 border-2 border-[#E6D7C3] shadow-md"
        >
          <h3 className="text-lg font-bold text-[#5D4037] mb-3 flex items-center gap-2">
            <Shield size={20} className="text-blue-500" />
            战斗小结
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="text-xs text-red-700 font-bold">造成伤害</div>
              <div className="text-2xl font-black text-red-600">{totals.damageDealt}</div>
            </div>
            {results.length > 1 && (
              <>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-green-700 font-bold">胜利次数</div>
                  <div className="text-2xl font-black text-green-600">{totals.victories}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-700 font-bold">总战斗</div>
                  <div className="text-2xl font-black text-gray-600">{results.length}</div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Rewards */}
        {isVictory && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-300 shadow-md"
          >
            <h3 className="text-lg font-bold text-[#5D4037] mb-3 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-600" />
              战利品
            </h3>
            <div className="space-y-3">
              {/* Gold */}
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Coins size={20} className="text-yellow-600" />
                  <span className="font-bold text-[#5D4037]">金币</span>
                </div>
                <span className="text-2xl font-black text-yellow-600">+{totals.gold}G</span>
              </div>

              {/* EXP */}
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-blue-600" />
                  <span className="font-bold text-[#5D4037]">经验值</span>
                </div>
                <span className="text-2xl font-black text-blue-600">+{totals.exp} EXP</span>
              </div>

              {/* Items */}
              {lootCounts.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="text-sm font-bold text-[#5D4037] mb-2">获得道具</div>
                  <div className="flex flex-wrap gap-2">
                    {lootCounts.map(({ name, count }, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-300"
                      >
                        {name}×{count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t-2 border-[#E6D7C3] bg-white space-y-3">
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={canContinue ? onContinueCombat : undefined}
          disabled={!canContinue}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex flex-col items-center justify-center gap-1 ${
            canContinue
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl active:scale-95 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-2">
            <Swords size={24} />
            {canContinue ? '继续战斗' : '体力不足'}
          </div>
          {!canContinue && (
            <div className="flex items-center gap-1 text-sm">
              <Zap size={14} />
              需要 {COMBAT_CONFIG.AP_COST_ENCOUNTER} AP（当前 {character.currentAP}）
            </div>
          )}
        </motion.button>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onReturnToAdventure}
          className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-[#89CFF0] to-[#7AC0E0] text-white hover:shadow-xl"
        >
          <ArrowRight size={24} />
          返回冒险
        </motion.button>
      </div>
    </div>
  );
};
