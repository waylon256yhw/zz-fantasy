/**
 * Event Detection System
 *
 * Automatically detects game events from AI-generated story text
 * and returns corresponding game state updates.
 *
 * Philosophy:
 * - AI writes story, program handles game logic
 * - No need for AI to output structured data
 * - Pattern matching on natural language
 */

export interface GameEvent {
  type: 'COMBAT' | 'VICTORY' | 'DEFEAT' | 'ITEM_FOUND' | 'GOLD_FOUND' | 'REST' | 'SHOP' | 'LEVEL_UP';
  data?: any;
}

/**
 * Random number generator helper
 */
function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Detect combat events
 */
function detectCombat(text: string): GameEvent | null {
  const combatKeywords = /战斗|击中|攻击|受伤|被打|挨揍|负伤|刀剑|利爪/i;
  if (combatKeywords.test(text)) {
    // Random HP loss between 5-20
    return {
      type: 'COMBAT',
      data: { hpLoss: random(5, 20) },
    };
  }
  return null;
}

/**
 * Detect victory events (defeating enemies)
 */
function detectVictory(text: string): GameEvent | null {
  const victoryKeywords = /击败|战胜|消灭|打倒|获胜|胜利|敌人倒下|怪物死亡/i;
  if (victoryKeywords.test(text)) {
    return {
      type: 'VICTORY',
      data: {
        expGain: random(30, 100),
        goldGain: random(10, 50),
      },
    };
  }
  return null;
}

/**
 * Detect defeat/death events
 */
function detectDefeat(text: string): GameEvent | null {
  const defeatKeywords = /倒下|失败|战败|昏迷|失去意识|死亡/i;
  if (defeatKeywords.test(text)) {
    return {
      type: 'DEFEAT',
      data: {},
    };
  }
  return null;
}

/**
 * Detect item acquisition
 */
function detectItemFound(text: string): GameEvent | null {
  const itemKeywords = /获得|得到|拾取|捡到|发现|宝箱|药剂|道具|装备/i;
  if (itemKeywords.test(text)) {
    // Extract item name from text (simple pattern matching)
    const itemMatch = text.match(/获得了?([^。！，、]*?)(药|剑|盾|铠|书|石|珠|戒指|项链)/);
    const itemName = itemMatch ? itemMatch[0] : '神秘道具';

    return {
      type: 'ITEM_FOUND',
      data: {
        itemName,
        // In a real implementation, you'd generate or lookup item data
      },
    };
  }
  return null;
}

/**
 * Detect gold acquisition
 */
function detectGoldFound(text: string): GameEvent | null {
  const goldKeywords = /金币|钱币|赏金|报酬|奖励.*金/i;
  if (goldKeywords.test(text)) {
    // Try to extract amount from text
    const amountMatch = text.match(/(\d+).*?金币/);
    const goldAmount = amountMatch ? parseInt(amountMatch[1]) : random(10, 50);

    return {
      type: 'GOLD_FOUND',
      data: { goldAmount },
    };
  }
  return null;
}

/**
 * Detect rest/healing events
 */
function detectRest(text: string): GameEvent | null {
  const restKeywords = /休息|疗伤|恢复|治疗|包扎|睡眠|旅馆|客栈/i;
  if (restKeywords.test(text)) {
    return {
      type: 'REST',
      data: { hpRecovered: random(20, 50) },
    };
  }
  return null;
}

/**
 * Main event detection function
 * Returns array of detected events (can be multiple)
 */
export function detectEvents(aiResponse: string): GameEvent[] {
  const events: GameEvent[] = [];

  // Check for all event types
  // Note: Order matters! Check defeat before victory to handle complex scenarios
  const detectors = [
    detectDefeat,
    detectVictory,
    detectCombat,
    detectItemFound,
    detectGoldFound,
    detectRest,
  ];

  for (const detector of detectors) {
    const event = detector(aiResponse);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Apply events to character state
 * Returns updated character data (use with React setState)
 */
export function applyEvents(
  events: GameEvent[],
  currentHp: number,
  maxHp: number,
  gold: number,
  exp: number
): {
  hp: number;
  gold: number;
  exp: number;
  notifications: string[];
} {
  let newHp = currentHp;
  let newGold = gold;
  let newExp = exp;
  const notifications: string[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'COMBAT':
        newHp = Math.max(0, newHp - event.data.hpLoss);
        notifications.push(`受到 ${event.data.hpLoss} 点伤害`);
        break;

      case 'VICTORY':
        newExp += event.data.expGain;
        newGold += event.data.goldGain;
        notifications.push(`获得 ${event.data.expGain} 经验值、${event.data.goldGain} 金币`);
        break;

      case 'DEFEAT':
        newHp = 0;
        notifications.push('你被击败了...');
        break;

      case 'ITEM_FOUND':
        notifications.push(`获得道具：${event.data.itemName}`);
        break;

      case 'GOLD_FOUND':
        newGold += event.data.goldAmount;
        notifications.push(`获得 ${event.data.goldAmount} 金币`);
        break;

      case 'REST':
        newHp = Math.min(maxHp, newHp + event.data.hpRecovered);
        notifications.push(`恢复 ${event.data.hpRecovered} HP`);
        break;

      case 'LEVEL_UP':
        notifications.push('等级提升！');
        break;
    }
  }

  return {
    hp: newHp,
    gold: newGold,
    exp: newExp,
    notifications,
  };
}
