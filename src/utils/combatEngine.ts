/**
 * Combat Engine - Core Battle Logic
 * Handles turn-based combat flow, actions, and outcomes
 */

import { Character, Enemy, CombatLog, CombatState } from '../../types';
import {
  calculateDamageToEnemy,
  calculateAPDamage,
  calculateRetreatChance,
  willEnemyUseStrongAttack,
  consumeAP,
  calculateAttackPower,
} from './combatSystem';
import { getMaxTurns } from './enemySystem';
import { COMBAT_CONFIG } from '../config/combatConfig';

/**
 * Initialize combat state when encounter starts
 */
export function initCombatState(enemy: Enemy): CombatState {
  return {
    isInCombat: true,
    currentEnemy: enemy,
    combatLogs: [
      {
        id: `log_${Date.now()}`,
        turn: 0,
        text: `遭遇了 ${enemy.rank}级 ${enemy.name}（Lv.${enemy.level}）！${
          enemy.isTreasureMonster ? ' 这是稀有的珍宝怪！' : ''
        }`,
        type: 'system',
      },
    ],
    currentTurn: 1,
    maxTurns: getMaxTurns(enemy),
    isPlayerStunned: false,
    enemyNextAction: willEnemyUseStrongAttack() ? 'STRONG' : 'NORMAL',
    apRegenBuffTurnsRemaining: 0,
    showSettlement: false,
    currentResult: null,
    sessionResults: [],
  };
}

/**
 * Add log entry to combat logs
 */
function addLog(
  logs: CombatLog[],
  turn: number,
  text: string,
  type: CombatLog['type']
): CombatLog[] {
  return [
    ...logs,
    {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      turn,
      text,
      type,
    },
  ];
}

/**
 * Execute player attack action
 */
export function executePlayerAttack(
  character: Character,
  enemy: Enemy,
  state: CombatState
): {
  updatedCharacter: Character;
  updatedEnemy: Enemy;
  newLogs: CombatLog[];
  combatResult: 'continue' | 'victory' | 'defeat';
} {
  let logs = [...state.combatLogs];
  let updatedCharacter = { ...character };
  let updatedEnemy = { ...enemy };

  // 1. Player attacks enemy
  const playerAttack = calculateAttackPower(character);
  const damage = calculateDamageToEnemy(playerAttack, enemy.defense);
  updatedEnemy.currentHp = Math.max(0, updatedEnemy.currentHp - damage);

  logs = addLog(logs, state.currentTurn, `你对 ${enemy.name} 造成了 ${damage} 点伤害！`, 'damage');

  // 2. Check if enemy is defeated
  if (updatedEnemy.currentHp <= 0) {
    logs = addLog(logs, state.currentTurn, `${enemy.name} 被击败了！`, 'victory');
    return {
      updatedCharacter,
      updatedEnemy,
      newLogs: logs,
      combatResult: 'victory',
    };
  }

  // 3. Consume AP for attack
  updatedCharacter.currentAP = consumeAP(character.currentAP, 'attack');

  // 4. Enemy counter-attack
  const { character: charAfterEnemyAttack, logs: logsAfterEnemy, result } = executeEnemyAttack(
    updatedCharacter,
    updatedEnemy,
    logs,
    state
  );

  updatedCharacter = charAfterEnemyAttack;
  logs = logsAfterEnemy;

  if (result !== 'continue') {
    return { updatedCharacter, updatedEnemy, newLogs: logs, combatResult: result };
  }

  return { updatedCharacter, updatedEnemy, newLogs: logs, combatResult: 'continue' };
}

/**
 * Execute player defend action
 */
export function executePlayerDefend(
  character: Character,
  enemy: Enemy,
  state: CombatState
): {
  updatedCharacter: Character;
  updatedEnemy: Enemy;
  newLogs: CombatLog[];
  combatResult: 'continue' | 'defeat';
} {
  let logs = [...state.combatLogs];
  let updatedCharacter = { ...character };

  // 1. Player enters defense stance
  logs = addLog(logs, state.currentTurn, `你进入了防御姿态。`, 'action');

  // 2. Consume AP for defend
  updatedCharacter.currentAP = consumeAP(character.currentAP, 'defend');

  // 3. Enemy attacks (with defense active)
  const { character: charAfterEnemyAttack, logs: logsAfterEnemy, result } = executeEnemyAttack(
    updatedCharacter,
    enemy,
    logs,
    state,
    true // isDefending flag
  );

  updatedCharacter = charAfterEnemyAttack;
  logs = logsAfterEnemy;

  if (result !== 'continue') {
    return { updatedCharacter, updatedEnemy: enemy, newLogs: logs, combatResult: result };
  }

  return { updatedCharacter, updatedEnemy: enemy, newLogs: logs, combatResult: 'continue' };
}

/**
 * Enemy attack logic (called after player action)
 */
function executeEnemyAttack(
  character: Character,
  enemy: Enemy,
  logs: CombatLog[],
  state: CombatState,
  isPlayerDefending: boolean = false
): {
  character: Character;
  logs: CombatLog[];
  result: 'continue' | 'defeat';
} {
  let updatedCharacter = { ...character };
  let updatedLogs = [...logs];

  const isStrongAttack = state.enemyNextAction === 'STRONG';

  // Calculate AP damage
  const apDamage = calculateAPDamage(enemy.attack, isStrongAttack, isPlayerDefending);
  updatedCharacter.currentAP = Math.max(0, updatedCharacter.currentAP - apDamage);

  // Log enemy attack
  if (isStrongAttack && isPlayerDefending) {
    updatedLogs = addLog(
      updatedLogs,
      state.currentTurn,
      `${enemy.name} 发动强力攻击！你成功格挡，只消耗了 ${apDamage} 点行动点。`,
      'action'
    );
  } else if (isStrongAttack && !isPlayerDefending) {
    updatedLogs = addLog(
      updatedLogs,
      state.currentTurn,
      `${enemy.name} 发动强力攻击！消耗了你 ${apDamage} 点行动点，你被击晕了！`,
      'warning'
    );
  } else {
    updatedLogs = addLog(
      updatedLogs,
      state.currentTurn,
      `${enemy.name} 对你造成了 ${apDamage} 点行动点伤害。${
        isPlayerDefending ? '（防御减伤）' : ''
      }`,
      'damage'
    );
  }

  // Check if player's AP is depleted
  if (updatedCharacter.currentAP <= 0) {
    updatedLogs = addLog(updatedLogs, state.currentTurn, `行动点耗尽，战斗失败...`, 'defeat');
    return { character: updatedCharacter, logs: updatedLogs, result: 'defeat' };
  }

  return { character: updatedCharacter, logs: updatedLogs, result: 'continue' };
}

/**
 * Handle stunned turn (player cannot act)
 */
export function handleStunnedTurn(
  character: Character,
  enemy: Enemy,
  state: CombatState
): {
  updatedCharacter: Character;
  newLogs: CombatLog[];
  combatResult: 'continue' | 'defeat';
} {
  let logs = [...state.combatLogs];
  let updatedCharacter = { ...character };

  logs = addLog(logs, state.currentTurn, `你被击晕了，无法行动...`, 'system');

  // Enemy continues to attack (normal attack, use shared AP damage formula)
  const apDamage = calculateAPDamage(enemy.attack, false, false);
  updatedCharacter.currentAP = Math.max(0, updatedCharacter.currentAP - apDamage);

  logs = addLog(
    logs,
    state.currentTurn,
    `${enemy.name} 趁机攻击，消耗了你 ${apDamage} 点行动点！`,
    'damage'
  );

  // Check if player's AP is depleted
  if (updatedCharacter.currentAP <= 0) {
    logs = addLog(logs, state.currentTurn, `行动点耗尽，战斗失败...`, 'defeat');
    return { updatedCharacter, newLogs: logs, combatResult: 'defeat' };
  }

  logs = addLog(logs, state.currentTurn, `你从眩晕中恢复了。`, 'system');

  return { updatedCharacter, newLogs: logs, combatResult: 'continue' };
}

/**
 * Attempt retreat (escape from combat)
 */
export function attemptRetreat(
  character: Character,
  enemy: Enemy,
  state: CombatState
): {
  success: boolean;
  updatedCharacter: Character;
  newLogs: CombatLog[];
  combatResult: 'continue' | 'escaped' | 'defeat';
} {
  let logs = [...state.combatLogs];
  let updatedCharacter = { ...character };

  const retreatChance = calculateRetreatChance(character);
  const success = Math.random() < retreatChance;

  if (success) {
    // Successful retreat with AP penalty
    updatedCharacter.currentAP = Math.max(
      0,
      updatedCharacter.currentAP - COMBAT_CONFIG.RETREAT_AP_COST
    );
    logs = addLog(
      logs,
      state.currentTurn,
      `成功撤退了！（消耗 ${COMBAT_CONFIG.RETREAT_AP_COST} 点行动点）`,
      'system'
    );
    return { success: true, updatedCharacter, newLogs: logs, combatResult: 'escaped' };
  } else {
    // Failed retreat, enemy gets free attack and turn is consumed
    const apDamage = calculateAPDamage(enemy.attack, false, false);
    updatedCharacter.currentAP = Math.max(0, updatedCharacter.currentAP - apDamage);
    logs = addLog(
      logs,
      state.currentTurn,
      `撤退失败！在逃跑时被攻击，消耗了 ${apDamage} 点行动点。`,
      'damage'
    );

    // Check if player's AP is depleted after failed retreat
    if (updatedCharacter.currentAP <= 0) {
      logs = addLog(logs, state.currentTurn, `行动点耗尽，战斗失败...`, 'defeat');
      return { success: false, updatedCharacter, newLogs: logs, combatResult: 'defeat' };
    }

    return { success: false, updatedCharacter, newLogs: logs, combatResult: 'continue' };
  }
}

/**
 * Generate combat result prompt for AI narration
 * Only called when combat ends
 */
export function generateCombatResultPrompt(
  result: 'victory' | 'defeat' | 'escaped' | 'timeout',
  enemy: Enemy,
  rewards?: { gold: number; exp: number; items?: string[] }
): string {
  if (result === 'victory') {
    const itemText =
      rewards?.items && rewards.items.length > 0
        ? `\n获得物品：${rewards.items.join('、')}`
        : '';
    return `我遭遇了${enemy.rank}级敌人「${enemy.name}」（Lv.${enemy.level}），战斗结果：胜利！获得奖励：金币 +${rewards?.gold || 0}，经验 +${rewards?.exp || 0}${itemText}`;
  } else if (result === 'defeat') {
    return `我遭遇了${enemy.rank}级敌人「${enemy.name}」（Lv.${enemy.level}），战斗结果：失败...行动点耗尽，请叙述我如何从失败中恢复（可能是路人救助、或自动回到安全点）。`;
  } else if (result === 'escaped') {
    return `我遭遇了${enemy.rank}级敌人「${enemy.name}」（Lv.${enemy.level}），战斗结果：成功撤退，逃离了战斗。`;
  } else {
    // timeout
    return `我遭遇了${enemy.rank}级敌人「${enemy.name}」（Lv.${enemy.level}），战斗结果：回合用尽，敌人逃走了。`;
  }
}
