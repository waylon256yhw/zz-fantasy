## 战斗系统设计草稿（v1）

本稿用于梳理当前战斗系统的「概念模型」和「代码抽象」，为后续重构与拓展（技能、特殊敌人、更多 Buff）打基础。**本稿优先保证与现状兼容，不作为强制实现规范。**

---

## 1. 战斗相关核心概念

### 1.1 角色与敌人

- `Character`（玩家）
  - 属性：`stats`（STR / DEX / INT / CHA / LUCK）
  - 战斗资源：`currentAP / maxAP`（行动点）
  - 其他：HP/MP（主要用于气氛与长期疲劳）、等级与经验、背包。
- `Enemy`（敌人）
  - 属性：`level`, `rank`（D/C/B/A）
  - 战斗资源：`currentHp / maxHp`（生命值）、`attack / defense`
  - 标记：`isTreasureMonster`（珍宝怪）
  - 掉落：金币、经验、道具列表。

### 1.2 CombatState（战斗状态）

`CombatState` 是一次「遭遇战会话」中的即时状态（不进存档）：

- 核心字段：
  - `isInCombat`: 是否处于回合制战斗中。
  - `currentEnemy`: 当前战斗中的敌人。
  - `combatLogs`: 回合内的战斗日志（系统层面）。
  - `currentTurn`: 当前回合编号（从 1 开始）。
  - `maxTurns`: 本次战斗的最大回合数（珍宝怪更短）。
  - `isPlayerStunned`: 玩家是否处于眩晕，无法选择行动。
  - `enemyNextAction`: 敌人下次攻击类型（NORMAL / STRONG）。
  - `apRegenBuffTurnsRemaining`: 治愈药水持续生效剩余回合。
- 会话与结算：
  - `showSettlement`: 是否显示战斗结算界面。
  - `currentResult`: 当前这场战斗的结果。
  - `sessionResults`: 本次会话内所有战斗的结果（支持连续刷怪）。

> 设计约定：CombatState **不会**直接持久化到存档，仅 AP 会被单独保存（`combatAP`）。因此，调整 CombatState 结构对旧存档兼容性影响较小。

---

## 2. 战斗阶段与状态机

可以把战斗流程抽象为三个阶段（由 `CombatState` 的组合状态隐式表示）：

1. **Idle（非战斗）**
   - 条件：`isInCombat === false && showSettlement === false && currentEnemy === null`
   - 玩家可以正常对话、移动、吃饭、购物等。
2. **Battle（战斗中）**
   - 条件：`isInCombat === true && showSettlement === false && currentEnemy !== null`
   - 玩家通过 `CombatSheet` 执行一回合一个操作：
     - 发起战斗（首次遭遇战）
     - 回合内操作：攻击、防御、喝药、撤退、眩晕时跳过
3. **Settlement（结算中）**
   - 条件：`isInCombat === false && showSettlement === true && currentResult !== null`
   - 展示单场或多场战斗结果，支持：
     - 「继续战斗」：在同一会话中开始下一场遭遇战（保留 `sessionResults`）。
     - 「返回冒险」：基于 `sessionResults` 生成总结日志，重置 `CombatState`。

> 后续如有需要，可以在 `CombatState` 中显式增加 `phase: 'idle' | 'battle' | 'settlement'` 字段，使状态机更直观，但当前版本先维持隐式表达。

---

## 3. 回合与 timeout 设计

### 3.1 回合计数语义

- `currentTurn`：当前正在结算的「玩家行动 + 敌人反击」所处的回合编号（从 1 起）。
- `maxTurns`：本场战斗允许的最大回合数：
  - 普通敌人：`COMBAT_CONFIG.MAX_TURNS`
  - 珍宝怪：`COMBAT_CONFIG.TREASURE_MAX_TURNS`

设计意图：

- 玩家最多可以实际执行 `maxTurns` 次行动（每次行动包含敌人反击）。
- 当尝试进入第 `maxTurns + 1` 回合时，判定为「回合用尽，敌人逃走」。

### 3.2 timeout 判定规范（重构目标）

为避免逻辑分散，**timeout 判定应集中在 GameContext 中统一处理**：

- 每次玩家行为结算结束后：
  1. 若战斗已经因胜利/失败/撤退结束，则立即进入结算阶段。
  2. 若战斗继续，则计算 `nextTurn = currentTurn + 1`。
  3. 若 `nextTurn > maxTurns`：
     - 追加一条 timeout 日志，`turn: nextTurn`，文案：
       - 普通敌人：`回合用尽，敌人逃走了...`
       - 珍宝怪：`回合用尽，珍宝怪逃走了...`
     - 将结果视为 `timeout`，调用 `endCombat('timeout', ...)`。
  4. 否则，把 `currentTurn` 更新为 `nextTurn`，继续下一回合。

实现策略：

- 数值层的 `combatEngine` 只关心「本回合的行为与反击」，不再自行调用 `checkTimeout`，也不直接返回 `timeout`。
- 回合推进与 timeout 由 `GameContext` 在每个入口处（攻击、防御、喝药、眩晕跳过、撤退失败）统一处理。

---

## 4. 行动类型与眩晕规则

### 4.1 行动类型

当前支持的玩家行动：

- `attack`：普通攻击
  - 逻辑：计算攻击力 → 伤害敌人 HP → 扣自己 AP → 敌人反击。
- `defend`：防御
  - 逻辑：进入防御姿态 → 扣较少 AP → 敌人攻击，AP 伤害减半。
- `useHealPotion`：治愈药水
  - 效果：立即恢复一段 AP，并在后续若干回合内持续回复。
  - 敌人会立刻攻击一次（可能是强攻）。
- `useArcaneTonic`：秘药·灵能酿（瞬间回满 AP）。
  - 敌人也会立刻攻击一次。
- `retreat`：尝试撤退
  - 成功：消耗一定 AP，结果视为 `escaped`。
  - 失败：敌人获得一次额外攻击，回合结束。
- `skip`：在眩晕状态下「跳过回合」
  - 玩家无法主动选择其他行为。

### 4.2 敌人强攻与眩晕

强攻机制：

- 敌人每回合根据 `COMBAT_CONFIG.STRONG_ATTACK_PROBABILITY` 决定下一次攻击是否为 STRONG。
- 强攻时：
  - AP 伤害 = `attack * STRONG_ATTACK_MULTIPLIER`
  - 若玩家防御：仍按减伤规则计算（乘以 `DEFEND_AP_REDUCTION`）。

眩晕规则（当前设计）：

- 触发条件：
  - 敌人使用 STRONG 攻击，且该回合玩家没有选择 `defend`，且战斗在本回合未结束。
- 眩晕效果：
  - 设置 `isPlayerStunned = true`。
  - 下一回合，玩家只能执行 `skip` 行动：
    - 记录「你被击晕了，无法行动...」日志。
    - 敌人获得一次额外攻击（视为普通攻击）。
    - 若 AP 归零 → 立即战败。
    - 若回合耗尽 → timeout（由 GameContext 统一判定）。
    - 否则记录「你从眩晕中恢复了」，`isPlayerStunned = false`，进入下一回合。

重构目标：

- `handleStunnedTurn` 统一通过 `calculateAPDamage(enemy.attack, false, false)` 计算这次额外攻击的 AP 伤害，以减少硬编码和未来改数值时的遗漏风险（与普通攻击保持一致的数值通道）。
- 与其他行动一样，眩晕回合结束后是否 timeout 由 GameContext 基于 `nextTurn` 统一判定。

---

## 5. 引擎层 vs 上下文层职责划分

### 5.1 combatEngine（数值与单回合流程）

`src/utils/combatEngine.ts` 的职责：

- 提供**纯战斗数值逻辑**与「单回合内动作」的流程：
  - `initCombatState(enemy)`：初始化战斗状态（首条遭遇日志、回合 1、maxTurns、敌人下一回合行动）。
  - `executePlayerAttack(character, enemy, state)`：
    - 计算玩家攻击 → 敌人扣 HP → 玩家扣 AP → 敌人反击 → 返回本回合结果。
  - `executePlayerDefend(...)`：
    - 进入防御 → 扣 AP → 敌人按防御规则攻击。
  - `handleStunnedTurn(...)`：
    - 已眩晕情况下的一整个「被打 + 恢复」回合。
  - `attemptRetreat(...)`：
    - 成功/失败的数值结算与日志。
  - `generateCombatResultPrompt(...)`：
    - 单场战斗结果给 AI 的描述（未来可与会话总结整合）。

重构方向：

- 这些函数**不再调用** `checkTimeout` 或返回 `timeout`，只负责当前回合内部的具体行为与结果（continue / victory / defeat / escaped）。
- 所有与「是否还能继续下一回合」相关的判断交给 GameContext 统一处理。

### 5.2 GameContext（全局状态与多轮连战）

`src/contexts/GameContext.tsx` 的职责：

- 管理全局 `combatState` 与 UI 行为入口：
  - `startCombat()`：扣遭遇战 AP，生成敌人，调用 `initCombatState`，根据是否在结算中决定是否保留 `sessionResults`。
  - `executeCombatAction(action)`：统一处理攻击、防御、喝药、眩晕回合跳过等。
  - `handleRetreat()`：封装撤退行为并处理失败后的回合推进。
  - `processCombatTurn()`：预留接口，可用于未来「自动推进眩晕/状态回合」。
  - `endCombat(result, enemy, logs)`：生成 `CombatResult`，发放奖励，更新 `sessionResults` 并进入结算态。
  - `continueEncounter()`：在同一会话中开启下一场遭遇战。
  - `returnToAdventure()`：根据 `sessionResults` 汇总日志，重置 combat 状态。

重构方向：

- 为「回合推进 + timeout 判定」抽出统一的小工具函数，例如：

```ts
function advanceTurnOrTimeout(
  character: Character,
  enemy: Enemy,
  combatState: CombatState,
  logs: CombatLog[]
): { ended: boolean; timeoutLogs?: CombatLog[]; nextTurn?: number }
```

- 所有入口（attack/defend/potion/stun/retreat）都在 GameContext 内调用这套统一逻辑，避免 timeout 判定分散在 engine 与 context 两侧。

---

## 6. 多轮连战与拓展点

### 6.1 多轮连战（Session）

「战斗会话」定义为从玩家首次点击「发起遭遇战」开始，到点击「返回冒险」结束的连续战斗序列：

- 会话内可能包含多场战斗，每场战斗结束时都会追加一个 `CombatResult` 到 `sessionResults`。
- 结算界面展示：
  - 最后一场战斗的详情（敌人信息、单场表现）。
  - 基于 `sessionResults` 的汇总统计（总金币、总经验、总伤害、总战斗数、各类战利品堆叠展示）。

### 6.2 拓展点

在保持现有体验的前提下，这个设计支持后续扩展：

- **技能系统**：在 `executeCombatAction` 与 `combatEngine` 中新增动作类型（如群攻、Buff、Dot），并通过统一回合推进逻辑保证 timeout 行为一致。
- **特殊敌人机制**：在 `Enemy` 上增加特性（反击、护盾等），只要遵守「单回合结算 → GameContext 统一推进回合」的约定即可。
- **成就 / 连胜系统**：在 `returnToAdventure` 内对 `sessionResults` 调用一个纯函数（如 `aggregateSessionStats`），输出成就与统计结构，既可用于 UI，也可用于 AI 叙事 Prompt。

---

## 7. 本轮重构范围（v1）

本次重构目标是「在不改变玩家体验的前提下，先把战斗核心逻辑的边界理顺」，具体包含：

1. **统一 timeout 判定出口**
   - 移除 `combatEngine` 内部对 `checkTimeout` 的直接调用，不再让 engine 返回 `timeout`。
   - 在 `GameContext` 中对所有入口（攻击、防御、眩晕跳过、撤退失败、喝药后敌人攻击）统一使用 `nextTurn > maxTurns` 的模式判定 timeout，并追加统一的 timeout 文案日志。
2. **规范眩晕回合数值逻辑**
   - `handleStunnedTurn` 攻击部分统一通过 `calculateAPDamage(enemy.attack, false, false)` 结算，避免 hard-code 攻击值。
3. **保留现有 UI 交互语义**
   - `CombatSheet` 和 `CombatResultSheet` 的按钮展示与可用条件保持不变。
   - 多轮连战（`sessionResults`）的行为与结算逻辑保持不变。

这些改动将作为后续更大规模重构（引入统一 `executePlayerAction`/`advanceTurn` 接口、加入技能与状态效果）之前的「地基整理」。

