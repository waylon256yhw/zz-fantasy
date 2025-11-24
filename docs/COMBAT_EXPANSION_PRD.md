## 战斗系统扩展 PRD（Phase 2+）

版本：v0.1  
状态：设计草稿（基于当前实现，指导后续迭代）  

---

## 1. 背景与目标

当前战斗系统（Phase 1）已经实现：

- AP 制回合战：攻击 / 防御 / 强攻 / 眩晕 / 撤退 / 回合上限。
- 多轮连战：一趟会话内多场战斗，统一结算。
- 装备与传奇物品的五维加成：`statsBonus` + 合并展示。

本轮扩展的目标：

1. **让敌人“立起来”**：每个敌人有明确图标、种族/元素标签、出没区域，与地图氛围联动。  
2. **让地图有难度地貌感**：地点存在推荐等级区间（新手村、高级区），同时支持后期动态追赶，避免全局碾压。  
3. **让成长与越级有反馈**：敌人与玩家同步成长，高等级回新手区仍有一定挑战感；越级挑战前给明确风险提示。  

不在本轮范围内（可后续考虑）：

- 技能树 / 主动技能系统。
- 属性相克（火/冰/暗/光）带来的数值修正。
- 完整装备更换（头/身/武器等槽位）。

---

## 2. 敌人数据模型扩展

### 2.1 当前状况

现有两层结构：

- `EnemyTemplate`（`enemySystem.ts` 内部）：
  - `name`, `baseHp`, `baseAttack`, `baseDefense`。
  - 按 rank（D/C/B/A）分池。
- 运行时 `Enemy`（`types.ts`）：
  - `name`, `level`, `rank`, `currentHp/maxHp`, `attack/defense`。
  - `isTreasureMonster` 与 `rewards`。

### 2.2 目标结构（模板层）

在 `EnemyTemplate` 增加一批面向 UI 与地图的字段：

- 基础信息（必选）：
  - `icon: string`  
    - 敌人图标路径或 emoji。  
    - 用于战斗界面敌人卡片、日志、荣誉墙等。
  - `family: 'slime' | 'goblin' | 'undead' | 'beast' | ...`  
    - 敌人族群/种类，用于图标样式与 AI prompt 文案。
  - `element: 'none' | 'fire' | 'ice' | 'shadow' | 'nature' | ...`  
    - 元素属性，当前仅展示标签，未来可用于相克算法。
  - `biomes: BiomeId[]`  
    - 敌人会出现在哪些区域类型（见 3. 地图联动）。

- 掉落倾向（可选）：
  - `preferredDrops?: string[]`（ALL_ITEMS key）  
    - 用于细化“史莱姆更容易掉史莱姆果冻，哥布林更爱掉耳朵”等风味；与当前 rank 基础奖励结合。

### 2.3 目标结构（运行时 Enemy）

在 `Enemy` 类型上补充：

- 新增字段：
  - `icon: string`
  - `family: string`
  - `element: string`

生成流程：

- `generateEnemyFromTemplate`：
  - 除已有的 HP/攻击/防御 scaling 外，从模板拷贝 `icon/family/element/biomes` 到 `Enemy` 实例。

UI 使用约定：

- `CombatSheet` 敌人卡片：直接消费 `enemy.icon / enemy.family / enemy.element`。
- 日志展示可选统一使用 `enemy.icon` 作为视觉前缀，不直接使用模板常量。

---

## 3. 敌人与地图联动（区域配置）

### 3.1 区域配置与地点映射

新增一层区域配置（建议新文件 `src/config/worldRegions.ts`，或合并入 `enemySystem.ts` 顶部）：

- `RegionConfig` 示例：

```ts
type RegionTier = 'low' | 'mid' | 'high' | 'endgame';

interface RegionConfig {
  id: string;                 // 内部区域 ID，如 'capital', 'forest_low'
  name: string;               // 展示名（可选）
  levelRange: { min: number; max: number }; // 推荐等级区间
  tier: RegionTier;           // 区域大致难度，用于动态 scaling
  scaling: {
    enabled: boolean;
    staticBuffer: number;     // 静态阶段缓冲（如 2 级）
    minDiffByTier: Record<RegionTier, number>; // 动态阶段相对玩家等级下界偏移
    maxDiffByTier: Record<RegionTier, number>; // 动态阶段相对玩家等级上界偏移
  };
}
```

- `LOCATION_REGION_MAP: Record<string, RegionId>`：
  - From 当前 location 字符串（如 `王都阿斯拉 - 中央广场`）到 `RegionConfig.id`。

### 3.2 区域→敌人池筛选

`encounterRandomEnemy(playerLevel, location, forceTreasure)` 增强为：

1. 通过 `location` 查到 `region`（如 `forest_low`）。  
2. 用 `region` 的 `biomes` 映射过滤敌人模板：
   - `candidateTemplates = ENEMY_TEMPLATES[rank].filter(t => t.biomes.includes(regionBiome))`。
   - 若该 biome 下某 rank 无模板，可回退到同 tier 的其它 biome，或退回当前全局 rank 池。
3. 根据目标等级（详见 4. 动态追赶）和 rank 在 `candidateTemplates` 中随机选择最终模板。

此设计确保：

- 敌人的出现位置与地图氛围一致（森林→史莱姆/狼，遗迹→骷髅/守卫）。
- 敌人-地图绑定只在配置层声明，不嵌在 UI 或战斗逻辑中。

---

## 4. 地区等级范围与动态追赶

### 4.1 静态区间（Early & Mid Game）

目标：让玩家在早期能明确感知“新手区 / 危险区”的差异。

规则建议：

- 对于玩家等级 `pLevel` 与区域 `region.levelRange = { min, max }`：
  - 若 `pLevel <= max + staticBuffer`（如 `staticBuffer = 2`）：
    - 敌人目标等级 `targetLevel = randomInt(min, max)`（可加 1 级抖动）。
  - 此阶段：区域难度主要由配置决定，玩家等级只是限制“能不能来”，不会大幅拉低当地怪物等级。

### 4.2 动态追赶（避免后期碾压）

当玩家显著超过区域建议上限时，启用动态追赶：

- 触发条件：
  - `pLevel > region.levelRange.max + staticBuffer`
- 目标：  
  - 低级区怪物仍然比玩家弱，但差距不至于夸张（如永远低 30 级）。  
  - 高级区怪物可以略高于玩家等级，保持挑战性。

示例算法：

```ts
function getTargetEnemyLevel(region: RegionConfig, pLevel: number): number {
  const { min, max, tier, scaling } = region;

  const withinStatic = pLevel <= max + scaling.staticBuffer;
  if (withinStatic) {
    return randomInt(min, max);
  }

  // 动态阶段，根据区域 tier 设定相对玩家等级的区间
  const baseMin = pLevel + scaling.minDiffByTier[tier]; // low: -3, mid: -1, high: +1, endgame: +2
  const baseMax = pLevel + scaling.maxDiffByTier[tier]; // low: -1, mid: +1, high: +3, endgame: +4

  // 和全局合理区间做 clamp，避免新手村怪变成 99 级
  const scaledMin = Math.max(min, baseMin);
  const scaledMax = Math.min(99, Math.max(scaledMin, baseMax));

  return randomInt(scaledMin, scaledMax);
}
```

`encounterRandomEnemy` 只需要在生成 `Enemy` 时使用 `targetLevel` 做基础 scaling 即可。

---

## 5. 越级挑战警告与推荐等级提示

### 5.1 推荐等级提示（进入区域时）

场景：玩家首次或久违来到某高危区域。

- 条件示例：
  - `pLevel + softThreshold < region.levelRange.min`（如 `softThreshold = 2`）。
- 行为：
  - 在主对话日志中追加一条系统文案，例如：
    - “你隐约察觉这里的魔物异常危险（推荐等级 ≥ 10 级），而你目前只有 7 级。”
  - 不阻止玩家行动，仅做场景渲染与温和提醒。

实现建议：

- 在 `setLocation` 后，由 `GameContext` 根据当前 `character.level` 与 `region.levelRange` 判断，并通过 `addLog` 写入系统日志。
- 为避免刷屏，可记录“区域危险提示已看过”的简单标记（in-memory 或存档中）。

### 5.2 发起遭遇战前的一次性确认

场景：玩家在明显越级的区域点击战斗面板的“发起遭遇战”。

- 在 `CombatSheet` 的 Encounter 按钮点击之前：
  1. 根据当前 `region` 与 `pLevel` 调用与 `getTargetEnemyLevel` 同源的预估函数（或直接调用）。  
  2. 若 `expectedLevel - pLevel >= dangerThreshold`（如 ≥ 4 级差）：  
     - 弹出确认提示（后续可用自定义 Modal，现阶段可以用 `window.confirm` 占位）：
       - “你的直觉告诉你这里的敌人远远强于现在的你（预估等级 X 级以上），确定要发起遭遇战吗？”
     - 确认：继续 `startCombat()` 并扣除遭遇战 AP。  
     - 取消：不进入战斗，也不扣 AP。
  3. 若仅略高（如 2~3 级差），可以用较轻的提示语：
     - “你感觉这里的魔物比你略强，稍有不慎可能失败。”

约束：

- 所有“危险评估”在 UI 层进行（CombatSheet/ GameInterface），`startCombat` 保持纯粹。
- 评估算法与生成算法共享同一套 `RegionConfig`，避免两边逻辑不一致。

---

## 6. 现有功能与新设计的衔接

### 6.1 与现有 statBonus 系统的衔接

现状（已实现）：

- `Character` 有 `stats`（基础五维）与 `statsBonus`（所有被动加成）。  
- `Item.statBonus` 用于装备与传奇物品的加成；  
- `computeStatsBonusFromInventory` 与 `computeTotalStatsBonus` 已经在 `GameContext` 中被用来刷新 `statsBonus`：
  - 来自背包装备。
  - 来自荣誉墙已点亮传奇物品（通过 `shopState.purchasedKeys`）。
- `CombatSheet` 顶部显示 `基础值 (+合并加成)`，战斗公式基于 `getTotalStats`。

新设计不需要改动 stat 计算方式，只需在敌人模板中同样使用类似结构（如果未来考虑敌方装备或特性），当前阶段只要为敌人添加图标与标签属性即可。

### 6.2 与现有战斗引擎的衔接

现状（已实现）：

- `combatEngine` 负责单回合战斗逻辑（攻击、防御、强攻、眩晕、撤退等）。
- `GameContext` 负责：
  - 敌人生成（调用 `encounterRandomEnemy`）。
  - 多轮连战与结算（`startCombat / endCombat / continueEncounter / returnToAdventure`）。

扩展点：

- `encounterRandomEnemy` 将成为“地区难度 + 动态追赶 + 敌人池筛选”的唯一入口。  
- `GameContext.startCombat` 与 `CombatSheet` Encounter 按钮之间增加“危险评估 + 确认”的 UI 层逻辑，不修改引擎层。

---

## 7. 实施优先级建议

1. **P1：敌人图标与标签基础接入**
   - 给所有现有敌人模板补上 `icon/family/element/biomes` 字段。
   - CombatSheet 敌人卡片展示 `icon + family + element`。
2. **P1：区域配置与地点映射（最小 demo）**
   - 至少为 3 个区域配置 `levelRange + tier`（如：王都/森林/遗迹）。
   - 将部分现有地点映射到这些区域，并在 `encounterRandomEnemy` 中使用 `levelRange` 代替“玩家等级 ±2”。
3. **P2：动态追赶与越级警告**
   - 按 4、5 节的算法实现 `getTargetEnemyLevel` 与 Encounter 按钮的确认逻辑。
   - 在日志中增加“区域推荐等级提示”。
4. **P3：更精细的敌人分布与掉落倾向**
   - 为不同区域定义更细的敌人池与 `preferredDrops`，增强风味与策略性。

本 PRD 主要用于指导 Phase 2+ 的 combat & world 设计；具体数值（等级区间、差值阈值）可在实现阶段根据体验调整。  

