/**
 * Simple Level System
 *
 * 设计原则：
 * 1. 固定经验需求（每级100exp），不要复杂公式
 * 2. 程序自动管理，AI完全不知道
 * 3. 两种经验来源：慢速（对话）+ 快速（成就）
 */

// 每级所需经验（固定值，简单易懂）
export const EXP_PER_LEVEL = 100;

/**
 * 获取升级所需经验（当前等级 → 下一级）
 */
export function getExpToNextLevel(currentLevel: number): number {
  return EXP_PER_LEVEL; // 固定值，不随等级变化
}

/**
 * 获取当前等级的经验进度百分比
 */
export function getExpProgress(currentExp: number, currentLevel: number): number {
  const expInCurrentLevel = currentExp % EXP_PER_LEVEL;
  return (expInCurrentLevel / EXP_PER_LEVEL) * 100;
}

/**
 * 计算添加经验后的新等级和剩余经验
 * 支持连续升级（一次获得大量经验时）
 */
export function addExperience(
  currentLevel: number,
  currentExp: number,
  expGain: number
): {
  newLevel: number;
  newExp: number;
  levelsGained: number;
} {
  let newExp = currentExp + expGain;
  let newLevel = currentLevel;
  let levelsGained = 0;

  // 检查是否可以升级（可能连续升多级）
  while (newExp >= EXP_PER_LEVEL && newLevel < 99) { // 最高99级
    newExp -= EXP_PER_LEVEL;
    newLevel += 1;
    levelsGained += 1;
  }

  // 防止超过99级
  if (newLevel >= 99) {
    newLevel = 99;
    newExp = 0; // 满级后经验归零
  }

  return {
    newLevel,
    newExp,
    levelsGained,
  };
}

/**
 * 经验来源配置（可调整的常量）
 */
export const EXP_SOURCES = {
  // 慢速增长 - 每次对话自动获得
  DIALOGUE: 3,           // 每次对话 +3 exp（33次对话 = 1级）

  // 快速成就 - 程序检测触发
  QUEST_COMPLETE: 50,    // 完成任务 +50 exp（2个任务 = 1级）
  COMBAT_VICTORY: 20,    // 战斗胜利 +20 exp（5次战斗 = 1级）
  ITEM_FOUND: 10,        // 发现物品 +10 exp（10个物品 = 1级）
  EXPLORATION: 15,       // 探索新地点 +15 exp

  // 特殊成就（未来扩展）
  BOSS_DEFEAT: 100,      // 击败BOSS +100 exp（直接升1级）
  QUEST_CHAIN: 150,      // 完成任务链 +150 exp（直接升1.5级）
} as const;

/**
 * 生成升级通知消息
 */
export function getLevelUpMessage(
  characterName: string,
  newLevel: number,
  levelsGained: number
): string {
  if (levelsGained === 1) {
    return `🎉 ${characterName} 升级了！等级提升至 ${newLevel}`;
  } else {
    return `🎉 ${characterName} 连续升级 ${levelsGained} 级！当前等级 ${newLevel}`;
  }
}

/**
 * 获取经验获得通知消息
 */
export function getExpGainMessage(expGain: number, source: string): string {
  return `+${expGain} EXP（${source}）`;
}
