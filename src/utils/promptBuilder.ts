/**
 * Minimal Prompt Builder for DZMM AI
 *
 * Philosophy:
 * - AI only generates story text (no data/calculations)
 * - Simple, easy-to-follow format requirements
 * - Focus on narrative quality over structured output
 */

import { Character, ClassType, Quest } from '../../types';
import { ALL_QUESTS } from '../../constants';

/**
 * Get character class traits in Chinese
 */
function getClassTraits(classType: ClassType): string {
  const traits: Record<ClassType, string> = {
    [ClassType.ALCHEMIST]: '精通炼金术，智慧超群，擅长药剂和魔法配制',
    [ClassType.KNIGHT]: '忠诚勇敢，体魄强健，王国的守护者',
    [ClassType.SKY_PIRATE]: '灵活敏捷，自由不羁，碧空之海的流浪者',
    [ClassType.SCHOLAR]: '博学多才，探索遗迹，知识的追寻者',
  };
  return traits[classType];
}

/**
 * Get class name in Chinese
 */
function getClassName(classType: ClassType): string {
  const names: Record<ClassType, string> = {
    [ClassType.ALCHEMIST]: '炼金术士',
    [ClassType.KNIGHT]: '王国骑士',
    [ClassType.SKY_PIRATE]: '碧空海盗',
    [ClassType.SCHOLAR]: '遗迹学者',
  };
  return names[classType];
}

/**
 * Build system prompt for AI story generation
 *
 * Key principles:
 * - No structured data output required
 * - No numerical calculations
 * - Pure narrative focus
 * - Simple formatting rules (dialogue「」, emphasis *text*)
 */
export function buildSystemPrompt(
  character: Character,
  location: string,
  activeQuestIds: string[] = []
): string {
  // Get active quest details
  const activeQuests = activeQuestIds
    .map(id => Object.values(ALL_QUESTS).find(q => q.id === id))
    .filter((q): q is Omit<Quest, 'status'> => q !== undefined);

  const questSection = activeQuests.length > 0
    ? `\n当前任务：
${activeQuests.map(q => `- ${q.title}：${q.description}`).join('\n')}

<重要>当玩家完成上述任务时，你必须在叙述中明确说明任务完成。
例如：对于讨伐任务，当敌人被击败时，明确写出"你打败了XXX"或"XXX倒下了"。
这样系统才能自动识别任务完成并发放奖励。</重要>`
    : '';

  return `<世界设定>
你是「艾瑟瑞亚战纪」的AI叙事者，这是一个魔法与科技交织的奇幻世界。
你的任务是根据玩家的行动，生成引人入胜的故事文本。

当前冒险者：
- 姓名：${character.name}
- 职业：${getClassName(character.classType)}
- 性别：${character.gender === 'Male' ? '男' : character.gender === 'Female' ? '女' : '其他'}
- 等级：${character.level}
- 特质：${getClassTraits(character.classType)}
${character.appearance ? `- 外貌：${character.appearance}` : ''}

当前位置：${location}${questSection}
</世界设定>

<创作风格>
1. 使用第二人称叙事（"你"），营造沉浸感
2. 融合日式RPG氛围：细腻的情感描写 + 幻想冒险元素
3. 适当添加NPC对话，用「」标记（例如：「欢迎来到王都！」商贩向你挥手）
4. 用*文本*标记角色的内心想法或需要强调的内容
5. 描述环境细节、气氛和角色内心感受
6. 保持故事连贯性，记住之前的对话内容
</创作风格>

<回复要求>
1. 每次回复200-300字
2. 不要输出数值（HP、金币等）
3. 不要输出选项或按钮
4. 不要输出任何结构化数据（JSON、XML等）
5. 纯粹的故事文本即可
</回复要求>

<示例>
用户输入：我走向广场中央的喷泉

你的回复：
你缓步走向广场中央，那座古老的喷泉在午后的阳光下闪烁着银色的光芒。泉水轻柔地流淌，发出悦耳的响声。喷泉中央立着一尊精美的女神雕像，她的面容温柔，仿佛在守护着这座城市的每一位冒险者。

「第一次来王都吗？」一位年轻的商贩注意到你，友好地挥了挥手，「这座喷泉可是王都的象征呢！许多冒险者都会在这里许愿祈祷。」

*或许我也该许个愿？*你心想。清凉的水雾飘散在空气中，让人感到格外舒适。
</示例>`;
}

/**
 * Build opening greeting for different story routes
 */
export function buildOpeningGreeting(
  character: Character,
  openingId: string
): string {
  const openings: Record<string, string> = {
    main: `欢迎来到艾瑟瑞亚世界，${character.name}。

作为一名${getClassName(character.classType)}，你踏上了成为传奇冒险者的旅程。此刻，你站在王都阿斯拉的中央广场上，周围是熙熙攘攘的人群和繁华的店铺。

*这就是新的开始。*你深吸一口气，准备开启你的冒险。

你想做什么？`,

    forest: `${character.name}在幽暗的迷雾森林中苏醒。

作为一名${getClassName(character.classType)}，你不记得自己是如何来到这片陌生森林的。四周弥漫着浓厚的雾气，古老的树木遮天蔽日，远处传来不知名生物的低吼声。

*这是哪里？我为什么会在这？*你努力回想，但记忆一片模糊。

唯一清晰的是——你必须找到出路。`,

    ruins: `${character.name}站在古代遗迹的入口前。

作为一名${getClassName(character.classType)}，你被这座沉睡千年的遗迹所吸引。石门上刻满了古老的文字和神秘的符号，似乎在诉说着一个被遗忘的故事。

「小心点，」同行的向导提醒你，「许多冒险者进去后就再也没出来。」

*但宝藏和真相就在里面。*你握紧手中的装备，准备踏入未知。`,
  };

  return (
    openings[openingId] ||
    openings.main ||
    `你的冒险即将开始，${character.name}。`
  );
}
