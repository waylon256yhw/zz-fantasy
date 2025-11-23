/**
 * Quest Completion Detector
 *
 * 自动检测AI输出中的任务完成关键词，触发任务完成
 * 类似 eventDetector.ts，但专门用于任务系统
 */

import { ALL_QUESTS } from '../../constants';

export interface QuestCompletionResult {
  completedQuestIds: string[];
  rewards: {
    gold: number;
    notifications: string[];
  };
}

/**
 * 检测AI输出中是否包含任务完成的关键词
 * @param aiResponse AI生成的文本
 * @param activeQuestIds 当前活跃的任务ID列表
 * @returns 完成的任务ID和奖励信息
 */
export function detectQuestCompletion(
  aiResponse: string,
  activeQuestIds: string[]
): QuestCompletionResult {
  const completedQuestIds: string[] = [];
  let totalGoldReward = 0;
  const notifications: string[] = [];

  // 遍历所有活跃任务，检测是否完成
  for (const questId of activeQuestIds) {
    const quest = Object.values(ALL_QUESTS).find(q => q.id === questId);
    if (!quest) continue;

    let isCompleted = false;

    // === 根据任务ID匹配完成条件 ===
    // 使用宽松的同义词匹配，覆盖更多表达方式
    switch (questId) {
      case 'quest_slime':
        // 讨伐：变异史莱姆
        // 覆盖所有可能的"击败"同义词
        if (
          /(击败|打败|战胜|消灭|干掉|解决|击杀|杀死|杀掉).{0,5}史莱姆/.test(aiResponse) ||
          /史莱姆.{0,10}(倒下|死|被杀|被击败|被消灭|化作|融化|消失)/.test(aiResponse) ||
          /【任务完成】.{0,20}史莱姆/.test(aiResponse)
        ) {
          isCompleted = true;
        }
        break;

      case 'quest_herb':
        // 采集：月光草
        if (
          /(采集|获得|收集|找到|拿到|得到).{0,5}月光草/.test(aiResponse) ||
          /月光草.{0,10}(到手|入袋)/.test(aiResponse) ||
          /【任务完成】.{0,20}月光草/.test(aiResponse)
        ) {
          isCompleted = true;
        }
        break;

      case 'quest_goblin':
        // 巡逻：哥布林营地
        if (
          /(击败|打败|战胜|消灭|干掉|清理|击退).{0,5}哥布林/.test(aiResponse) ||
          /哥布林.{0,10}(倒下|逃跑|溃散|被击退)/.test(aiResponse) ||
          /【任务完成】.{0,20}哥布林/.test(aiResponse)
        ) {
          isCompleted = true;
        }
        break;

      case 'quest_ruins':
        // 探索：古代遗迹
        if (
          /(发现|找到|获得|得到).{0,5}(文献|书卷|典籍|古籍)/.test(aiResponse) ||
          /(古代|遗迹).{0,10}(文献|书卷)/.test(aiResponse) ||
          /【任务完成】.{0,20}遗迹/.test(aiResponse)
        ) {
          isCompleted = true;
        }
        break;

      default:
        // 其他任务暂不处理
        break;
    }

    // 如果检测到完成
    if (isCompleted) {
      completedQuestIds.push(questId);
      totalGoldReward += quest.reward;
      notifications.push(`✓ 任务完成：${quest.title}（+${quest.reward}G）`);
    }
  }

  return {
    completedQuestIds,
    rewards: {
      gold: totalGoldReward,
      notifications,
    },
  };
}

/**
 * 通用关键词检测（未来扩展用）
 * 可以为新任务添加通用的完成条件模式
 */
export function detectByKeywords(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => new RegExp(keyword).test(text));
}

/**
 * 获取任务完成的推荐关键词（用于调试和文档）
 */
export function getQuestCompletionKeywords(questId: string): string[] {
  const keywords: Record<string, string[]> = {
    quest_slime: [
      '击败史莱姆', '打败史莱姆', '战胜史莱姆', '消灭史莱姆',
      '史莱姆倒下', '史莱姆被消灭', '史莱姆化作液体',
      '【任务完成】讨伐：变异史莱姆'
    ],
    quest_herb: [
      '采集月光草', '获得月光草', '收集月光草', '找到月光草',
      '月光草到手', '【任务完成】采集：月光草'
    ],
    quest_goblin: [
      '击败哥布林', '打败哥布林', '消灭哥布林', '清理哥布林',
      '哥布林逃跑', '【任务完成】巡逻：哥布林营地'
    ],
    quest_ruins: [
      '发现文献', '找到文献', '获得古代书卷',
      '【任务完成】探索：古代遗迹'
    ],
  };

  return keywords[questId] || [];
}
