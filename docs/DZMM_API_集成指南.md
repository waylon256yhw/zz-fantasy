# DZMM API 集成指南

> **文档目的：** 为 React 架构提供完整的 DZMM API 集成参考，包含所有 API 调用场景、数据结构和封装建议。
>
> **源代码参考：** `/root/zz-fantasy/alpinejs/fantasy.html` (4814行)

---

## 📑 目录

1. [DZMM API 概览](#1-dzmm-api-概览)
2. [初始化和就绪检测](#2-初始化和就绪检测)
3. [dzmm.completions API](#3-dzmmcompletions-api)
4. [dzmm.kv API](#4-dzmmkv-api)
5. [dzmm.chat API](#5-dzmmchat-api)
6. [dzmm.draw API](#6-dzmmdraw-api)
7. [双模型架构实现](#7-双模型架构实现)
8. [错误处理和最佳实践](#8-错误处理和最佳实践)
9. [完整代码示例](#9-完整代码示例)

---

## 1. DZMM API 概览

### 1.1 API 调用统计

在原 Alpine.js 实现中，共调用 DZMM API **28次**：

| API | 调用次数 | 主要用途 |
|-----|---------|---------|
| `dzmm.completions` | 7次 | AI 文本生成（故事、数据解析、任务系统、绘图提示词） |
| `dzmm.kv.put` | 7次 | 数据持久化（存档、自定义内容、画廊） |
| `dzmm.kv.get` | 6次 | 数据读取（存档、自定义内容、画廊） |
| `dzmm.chat.list` | 5次 | 获取对话历史 |
| `dzmm.chat.insert` | 2次 | 保存对话记录 |
| `dzmm.draw.generate` | 1次 | 生成角色立绘 |

### 1.2 在 React 项目中的集成位置建议

```
/src
├── services/
│   └── dzmm/
│       ├── index.ts              # API 统一导出
│       ├── completions.ts        # completions API 封装
│       ├── storage.ts            # KV 存储封装
│       ├── chat.ts               # chat API 封装
│       └── draw.ts               # draw API 封装
├── hooks/
│   ├── useDZMM.ts                # 统一 DZMM Hook
│   ├── useDZMMCompletion.ts      # completions Hook
│   ├── useDZMMStorage.ts         # KV 存储 Hook
│   └── useDZMMChat.ts            # chat Hook
├── contexts/
│   └── DZMMContext.tsx           # 全局 DZMM 状态（模型配置、初始化状态）
└── utils/
    ├── promptBuilder.ts          # 提示词构建工具
    └── responseParser.ts         # AI 响应解析工具
```

---

## 2. 初始化和就绪检测

### 2.1 Alpine.js 原始实现

**源代码位置：** `alpinejs/fantasy.html` 行 874-886

```javascript
// 通知父窗口准备就绪
if (window.parent !== window) {
  window.parent.postMessage('iframe:content-ready', '*');
}

// 等待 DZMM API 就绪
const dzmmReady = new Promise((resolve) => {
  window.addEventListener('message', function handler(event) {
    if (event.data?.type === 'dzmm:ready') {
      window.removeEventListener('message', handler);
      resolve();
    }
  });
});

// 在 Alpine.store 的 init 方法中使用
async init() {
  this.loading = true;
  this.loadingText = '正在连接服务器...';
  await dzmmReady;  // 等待 DZMM 就绪

  this.loadingText = '正在加载存档...';
  await this.loadSaveSlots();
  // ...
}
```

### 2.2 React 实现建议

#### 方式 1: 使用自定义 Hook（推荐）

**文件：** `hooks/useDZMM.ts`

```typescript
import { useState, useEffect } from 'react';

interface DZMMState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useDZMM = (): DZMMState => {
  const [state, setState] = useState<DZMMState>({
    isReady: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // 通知父窗口准备就绪
    if (window.parent !== window) {
      window.parent.postMessage('iframe:content-ready', '*');
    }

    // 双重检测：直接检查 + 事件监听
    let isResolved = false;

    const checkDZMM = () => {
      if (window.dzmm && !isResolved) {
        isResolved = true;
        setState({ isReady: true, isLoading: false, error: null });
      }
    };

    // 1. 立即检查
    checkDZMM();

    // 2. 监听 message 事件
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'dzmm:ready') {
        checkDZMM();
      }
    };

    window.addEventListener('message', handleMessage);

    // 3. 超时重试（2秒后再检查一次，防止事件丢失）
    const timeoutId = setTimeout(() => {
      checkDZMM();
      if (!isResolved) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'DZMM API 初始化超时',
        }));
      }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
};
```

**使用示例：**

```typescript
// App.tsx
import { useDZMM } from './hooks/useDZMM';

function App() {
  const { isReady, isLoading, error } = useDZMM();

  if (isLoading) {
    return <LoadingScreen text="正在连接 DZMM 服务器..." />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!isReady) {
    return null;
  }

  return <Routes>...</Routes>;
}
```

#### 方式 2: 使用 Context（适合复杂应用）

**文件：** `contexts/DZMMContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface DZMMContextValue {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  storyModel: string;
  responseModel: string;
  setStoryModel: (model: string) => void;
  setResponseModel: (model: string) => void;
}

const DZMMContext = createContext<DZMMContextValue | undefined>(undefined);

export const DZMMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyModel, setStoryModel] = useState('nalang-xl-0826-16k');
  const [responseModel, setResponseModel] = useState('nalang-xl-0826-16k');

  useEffect(() => {
    // ... 初始化逻辑（同上）
  }, []);

  return (
    <DZMMContext.Provider
      value={{
        isReady,
        isLoading,
        error,
        storyModel,
        responseModel,
        setStoryModel,
        setResponseModel,
      }}
    >
      {children}
    </DZMMContext.Provider>
  );
};

export const useDZMMContext = () => {
  const context = useContext(DZMMContext);
  if (!context) {
    throw new Error('useDZMMContext must be used within DZMMProvider');
  }
  return context;
};
```

---

## 3. dzmm.completions API

### 3.1 API 签名

```typescript
window.dzmm.completions(
  config: {
    model: string;           // 模型名称
    messages: Message[];     // 消息数组
    maxTokens?: number;      // 最大输出 token（可选，默认1000）
  },
  callback: (content: string, done: boolean) => void
): Promise<void>;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

**重要说明：**
- ⚠️ **不支持** `role: 'system'`，必须使用 `user` 或 `assistant`
- `maxTokens` 范围：200-3000，默认 1000
- `callback` 是流式回调：`done === false` 时持续调用，`done === true` 时结束
- `content` 是**累积内容**，不是增量内容

### 3.2 可用模型列表

| 模型名称 | 上下文窗口 | 特点 | 推荐用途 |
|---------|-----------|------|---------|
| `nalang-turbo-0826` | 32K | 最快，最经济 | 简单任务、快速响应 |
| `nalang-medium-0826` | 32K | 平衡性能 | 中等复杂任务 |
| `nalang-max-0826` | 32K | 强大推理 | 游戏AI、复杂规则 |
| `nalang-xl-0826` | 32K | 最强理解 | 复杂对话、长文本 |
| `nalang-max-0826-16k` | 16K | 快速强大 | 快速响应 + 质量 |
| `nalang-xl-0826-16k` | 16K | 快速稳定 | 快速响应 + 稳定性 |

### 3.3 七个调用场景详解

#### 场景 1: 生成故事正文

**源代码位置：** `alpinejs/fantasy.html` 行 1405-1418

**函数：** `generateStory(action, context)`

**用途：** 使用正文模型生成 RPG 游戏的叙事文本

**Alpine.js 原始代码：**

```javascript
async generateStory(action, context) {
  try {
    // 读取最近5条历史消息
    const allMessages = await window.dzmm.chat.list();
    const recentMessages = allMessages.slice(-5);

    // 构建提示词
    const storyPrompt = this.buildStoryPrompt(action, context);

    const messages = [
      { role: 'user', content: storyPrompt },
      ...recentMessages.map(msg => ({ role: msg.role, content: msg.content })),
    ];

    if (context.userAction && context.userAction.trim()) {
      messages.push({ role: 'user', content: context.userAction });
    }

    let fullContent = '';

    await window.dzmm.completions(
      {
        model: this.storyModel,  // 用户选择的正文模型
        messages,
        maxTokens: 1000
      },
      (content, done) => {
        fullContent = content;
        if (!done) {
          // 流式显示
          this.storyText = this.formatStory(fullContent);
        }
      }
    );

    return this.formatStory(fullContent);

  } catch (error) {
    console.error('正文生成失败:', error);
    return null;
  }
}
```

**React 实现建议：**

**文件：** `services/dzmm/completions.ts`

```typescript
interface CompletionConfig {
  model: string;
  messages: Message[];
  maxTokens?: number;
  onStream?: (content: string) => void;
}

export const generateCompletion = async ({
  model,
  messages,
  maxTokens = 1000,
  onStream,
}: CompletionConfig): Promise<string> => {
  return new Promise((resolve, reject) => {
    let fullContent = '';

    window.dzmm.completions(
      { model, messages, maxTokens },
      (content, done) => {
        fullContent = content;

        // 流式回调
        if (!done && onStream) {
          onStream(content);
        }

        // 完成时 resolve
        if (done) {
          resolve(fullContent);
        }
      }
    ).catch(reject);
  });
};
```

**文件：** `hooks/useDZMMCompletion.ts`

```typescript
import { useState, useCallback } from 'react';
import { generateCompletion } from '@/services/dzmm/completions';

export const useDZMMCompletion = () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    model: string,
    messages: Message[],
    maxTokens?: number
  ) => {
    setLoading(true);
    setError(null);
    setContent('');

    try {
      const result = await generateCompletion({
        model,
        messages,
        maxTokens,
        onStream: (streamContent) => {
          setContent(streamContent); // 实时更新
        },
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失败';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setContent('');
    setError(null);
    setLoading(false);
  }, []);

  return { loading, content, error, generate, reset };
};
```

**使用示例：**

```typescript
// pages/GameInterface.tsx
import { useDZMMCompletion } from '@/hooks/useDZMMCompletion';
import { useDZMMContext } from '@/contexts/DZMMContext';

function GameInterface() {
  const { storyModel } = useDZMMContext();
  const { loading, content, generate } = useDZMMCompletion();

  const handleAction = async (action: string) => {
    const messages = [
      { role: 'user', content: buildStoryPrompt(action) },
      ...recentHistory,
    ];

    await generate(storyModel, messages, 1000);
  };

  return (
    <div>
      {loading && <LoadingSpinner />}
      <StoryDisplay content={content} />
    </div>
  );
}
```

---

#### 场景 2: 解析故事并更新游戏数据

**源代码位置：** `alpinejs/fantasy.html` 行 1706-1715

**函数：** `parseStoryAndUpdate(storyText, action, context)`

**用途：** 使用响应模型从故事文本中提取结构化游戏数据

**Alpine.js 原始代码：**

```javascript
async parseStoryAndUpdate(storyText, action, context) {
  try {
    const userAction = context.userAction || '';

    // 构建解析提示词（包含当前游戏状态、已知内容列表、判定规则）
    const parsePrompt = `你是游戏数据分析器。请分析故事文本和用户行动，提取数据变化。

<current_context>
**用户行动**：${userAction}
**故事正文**：${storyText}
</current_context>

<current_data>
HP:${this.player.hp}/${this.player.maxHp}
MP:${this.player.mp}/${this.player.maxMp}
等级:${this.player.level}
金币:${this.player.gold}
经验:${this.player.exp}/${this.player.expToNext}
当前位置:${LOCATIONS[this.player.location].name}
战斗状态:${this.inBattle ? '战斗中' : '非战斗'}
</current_data>

<known_content>
**已知物品**：${Object.keys(ITEMS).concat(Object.keys(this.customItems)).join(', ')}
**已知敌人**：${Object.keys(ENEMIES).concat(Object.keys(this.customEnemies)).join(', ')}
</known_content>

<rules>
### 核心规则
1. 战斗触发判定：只有当故事正文中明确描述玩家遭遇/被攻击/进入战斗时，才判定"新敌人"
2. 数据变化判定：只记录故事中明确描述的变化
3. 自定义内容创建规则：故事中出现全新的物品/敌人/装备，且不在已知列表中
</rules>

<output_format>
###DATA
HP变化:数字
MP变化:数字
金币变化:数字
经验变化:数字
等级变化:数字
获得物品:ID或无
装备更新:ID或无
新敌人:ID或无
位置变化:ID或无
NPC名字:名字或无
战斗结束:胜利/逃跑/失败/继续
###END

###NEW
物品:ID,名字,emoji,类型,效果,数值,描述
敌人:ID,名字,emoji,HP,攻击,防御,经验,金币,描述
装备:ID,名字,emoji,类型,攻击,防御,描述
###END
</output_format>

现在分析：`;

    let responseText = '';

    await window.dzmm.completions(
      {
        model: this.responseModel,
        messages: [{ role: 'user', content: parsePrompt }],
        maxTokens: 400
      },
      (content, done) => {
        responseText = content;
      }
    );

    console.log('===== AI解析结果 =====');
    console.log(responseText);

    // 应用数据变化
    this.applyDataChanges(responseText, action);

    // 解析新内容
    this.parseNewContent(responseText);

  } catch (error) {
    console.error('解析失败:', error);
  }
}
```

**React 实现建议：**

**文件：** `utils/responseParser.ts`

```typescript
export interface GameDataChanges {
  hpChange?: number;
  mpChange?: number;
  goldChange?: number;
  expChange?: number;
  levelChange?: number;
  itemGained?: string;
  equipmentUpdate?: string;
  newEnemy?: string;
  locationChange?: string;
  npcName?: string;
  battleEnd?: 'victory' | 'flee' | 'defeat' | 'continue';
}

export interface NewContent {
  items?: Array<{
    id: string;
    name: string;
    icon: string;
    type: string;
    effect: string;
    value: number;
    desc: string;
  }>;
  enemies?: Array<{
    id: string;
    name: string;
    icon: string;
    hp: number;
    atk: number;
    def: number;
    exp: number;
    gold: number;
    desc: string;
  }>;
  equipment?: Array<{
    id: string;
    name: string;
    icon: string;
    type: string;
    atk: number;
    def: number;
    desc: string;
  }>;
}

export const parseDataBlock = (responseText: string): GameDataChanges => {
  const dataMatch = responseText.match(/###DATA([\s\S]*?)###END/);
  if (!dataMatch) return {};

  const lines = dataMatch[1].trim().split('\n');
  const changes: GameDataChanges = {};

  lines.forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());

    switch (key) {
      case 'HP变化':
        if (value !== '0') changes.hpChange = parseInt(value);
        break;
      case 'MP变化':
        if (value !== '0') changes.mpChange = parseInt(value);
        break;
      case '金币变化':
        if (value !== '0') changes.goldChange = parseInt(value);
        break;
      case '经验变化':
        if (value !== '0') changes.expChange = parseInt(value);
        break;
      case '等级变化':
        if (value !== '0') changes.levelChange = parseInt(value);
        break;
      case '获得物品':
        if (value !== '无') changes.itemGained = value;
        break;
      case '装备更新':
        if (value !== '无') changes.equipmentUpdate = value;
        break;
      case '新敌人':
        if (value !== '无') changes.newEnemy = value;
        break;
      case '位置变化':
        if (value !== '无') changes.locationChange = value;
        break;
      case 'NPC名字':
        if (value !== '无') changes.npcName = value;
        break;
      case '战斗结束':
        if (['胜利', '逃跑', '失败', '继续'].includes(value)) {
          const map: Record<string, GameDataChanges['battleEnd']> = {
            '胜利': 'victory',
            '逃跑': 'flee',
            '失败': 'defeat',
            '继续': 'continue',
          };
          changes.battleEnd = map[value];
        }
        break;
    }
  });

  return changes;
};

export const parseNewContent = (responseText: string): NewContent => {
  const newMatch = responseText.match(/###NEW([\s\S]*?)###END/);
  if (!newMatch) return {};

  const lines = newMatch[1].trim().split('\n');
  const content: NewContent = {
    items: [],
    enemies: [],
    equipment: [],
  };

  lines.forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());

    if (key === '物品' && value !== '无') {
      const parts = value.split(',').map(s => s.trim());
      if (parts.length >= 7) {
        const [id, name, icon, type, effect, val, desc] = parts;
        content.items!.push({
          id,
          name,
          icon,
          type,
          effect,
          value: parseInt(val) || 0,
          desc,
        });
      }
    }

    if (key === '敌人' && value !== '无') {
      const parts = value.split(',').map(s => s.trim());
      if (parts.length >= 9) {
        const [id, name, icon, hp, atk, def, exp, gold, desc] = parts;
        content.enemies!.push({
          id,
          name,
          icon,
          hp: parseInt(hp) || 50,
          atk: parseInt(atk) || 10,
          def: parseInt(def) || 5,
          exp: parseInt(exp) || 30,
          gold: parseInt(gold) || 20,
          desc,
        });
      }
    }

    if (key === '装备' && value !== '无') {
      const parts = value.split(',').map(s => s.trim());
      if (parts.length >= 7) {
        const [id, name, icon, type, atk, def, desc] = parts;
        content.equipment!.push({
          id,
          name,
          icon,
          type,
          atk: parseInt(atk) || 0,
          def: parseInt(def) || 0,
          desc,
        });
      }
    }
  });

  return content;
};
```

**使用示例：**

```typescript
// hooks/useGameDataParser.ts
import { useDZMMCompletion } from './useDZMMCompletion';
import { parseDataBlock, parseNewContent } from '@/utils/responseParser';
import { useGameState } from './useGameState';

export const useGameDataParser = () => {
  const { generate } = useDZMMCompletion();
  const { applyChanges, registerNewContent } = useGameState();

  const parseAndUpdate = async (storyText: string, gameState: GameState) => {
    const parsePrompt = buildParsePrompt(storyText, gameState);

    const responseText = await generate(
      gameState.responseModel,
      [{ role: 'user', content: parsePrompt }],
      400
    );

    console.log('===== AI解析结果 =====', responseText);

    // 解析数据变化
    const changes = parseDataBlock(responseText);
    applyChanges(changes);

    // 解析新内容
    const newContent = parseNewContent(responseText);
    registerNewContent(newContent);
  };

  return { parseAndUpdate };
};
```

---

#### 场景 3-7: 其他调用场景

**场景 3: 生成任务列表**
- **位置：** 行 1967-1976
- **模型：** responseModel
- **maxTokens：** 1000
- **输出格式：** XML `<quest>` 标签

**场景 4: 生成任务详情**
- **位置：** 行 2062-2071
- **模型：** responseModel
- **maxTokens：** 500
- **输出格式：** XML `<description>` 和 `<guide>` 标签

**场景 5: 生成任务提交剧情**
- **位置：** 行 2167-2177
- **模型：** storyModel
- **maxTokens：** 500
- **用途：** 生成玩家与公会接待员的对话

**场景 6: AI 判断任务完成度**
- **位置：** 行 2216-2225
- **模型：** responseModel
- **maxTokens：** 200
- **输出格式：** `###RESULT` 标记，三档评价（完全完成/部分完成/未完成）

**场景 7: 生成绘图提示词**
- **位置：** 行 2923-2928
- **模型：** responseModel
- **maxTokens：** 500
- **用途：** 将中文场景信息转换为英文 Stable Diffusion 提示词

> 详细的提示词模板请参考 `提示词工程文档.md`

---

## 4. dzmm.kv API

### 4.1 API 签名

```typescript
// 保存数据
window.dzmm.kv.put(key: string, value: string): Promise<void>;

// 读取数据
window.dzmm.kv.get(key: string): Promise<{ value: string | null }>;

// 删除数据
window.dzmm.kv.delete(key: string): Promise<void>;
```

**重要说明：**
- 键名长度：≤256 字符
- 值大小：建议 ≤1MB
- 数据类型：仅支持字符串，需要手动 `JSON.stringify` / `JSON.parse`
- **开发模式**：数据在页面刷新后丢失
- **生产模式**：数据持久化

### 4.2 存储结构设计

| 键名模式 | 数据类型 | 用途 | 调用位置 |
|---------|---------|------|---------|
| `rpg_save_slot_1` | `SaveData` | 游戏存档槽位1 | 行 1187, 1221 |
| `rpg_save_slot_2` | `SaveData` | 游戏存档槽位2 | 行 1187, 1221 |
| `rpg_save_slot_3` | `SaveData` | 游戏存档槽位3 | 行 1187, 1221 |
| `rpg_custom_items` | `Record<string, Item>` | AI生成的自定义物品 | 行 2499, 2513 |
| `rpg_custom_enemies` | `Record<string, Enemy>` | AI生成的自定义敌人 | 行 2500, 2514 |
| `rpg_custom_equipment` | `Record<string, Equipment>` | AI生成的自定义装备 | 行 2501, 2515 |
| `rpg_gallery` | `GalleryImage[]` | 角色立绘画廊 | 行 2973, 2981, 3000 |

### 4.3 完整数据结构定义

#### SaveData 接口

```typescript
interface SaveData {
  // 基础信息
  playerName: string;
  gender: 'male' | 'female';
  appearance: string;
  className: string;
  classId: string;
  level: number;
  location: string;
  timestamp: string;

  // 玩家完整数据
  player: {
    name: string;
    gender: 'male' | 'female';
    appearance: string;
    className: string;
    classId: string;
    level: number;
    exp: number;
    expToNext: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    atk: number;
    def: number;
    gold: number;
    location: string;
    inventory: Record<string, number>;  // { itemId: quantity }
    equipment: {
      weapon: string | null;
      armor: string | null;
      accessory: string | null;
    };
    skills: Skill[];
  };

  // 战斗状态
  inBattle: boolean;
  currentEnemy: Enemy | null;
  currentScene: string;

  // 任务系统
  adventurerRank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  adventurerExp: number;
  adventurerExpToNext: number;
  currentQuest: Quest | null;
  questHistory: Quest[];
  generatedQuestIds: string[];
}
```

#### CustomItems 数据结构

```typescript
interface CustomItem {
  id: string;
  name: string;
  icon: string;  // emoji
  type: 'consumable' | 'material' | 'key';
  effect: 'heal' | 'restore_mp' | 'full_heal' | string;
  value: number;
  desc: string;
  price: number;
}

type CustomItems = Record<string, CustomItem>;
```

#### CustomEnemies 数据结构

```typescript
interface CustomEnemy {
  id: string;
  name: string;
  icon: string;  // emoji
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  desc: string;
}

type CustomEnemies = Record<string, CustomEnemy>;
```

#### CustomEquipment 数据结构

```typescript
interface CustomEquipment {
  id: string;
  name: string;
  icon: string;  // emoji
  type: 'weapon' | 'armor' | 'accessory';
  atk: number;
  def: number;
  desc: string;
  price: number;
}

type CustomEquipment = Record<string, CustomEquipment>;
```

#### Gallery 数据结构

```typescript
interface GalleryImage {
  id: string;  // 格式: img-{timestamp}
  url: string;  // 图片 URL
  target: string;  // 生成对象名称（角色名/NPC名/敌人名）
  prompt: string;  // 英文绘图提示词
  timestamp: string;  // 中文时间戳
}

type Gallery = GalleryImage[];
```

### 4.4 Alpine.js 原始实现

#### 存档系统

**加载所有存档槽位 (行 1184-1195):**

```javascript
async loadSaveSlots() {
  try {
    for (let i = 1; i <= GAME_CONFIG.maxSaveSlots; i++) {
      const data = await window.dzmm.kv.get(`rpg_save_slot_${i}`);
      if (data?.value) {
        this.saveSlots[i] = JSON.parse(data.value);
      }
    }
  } catch (error) {
    console.warn('加载存档失败:', error);
  }
}
```

**保存游戏到指定槽位 (行 1197-1230):**

```javascript
async saveGame(slotId) {
  try {
    const saveData = {
      playerName: this.player.name,
      gender: this.player.gender,
      appearance: this.player.appearance,
      className: this.player.className,
      classId: this.player.classId,
      level: this.player.level,
      location: LOCATIONS[this.player.location].name,
      timestamp: new Date().toLocaleString('zh-CN'),
      player: this.player,
      inBattle: this.inBattle,
      currentEnemy: this.currentEnemy,
      currentScene: this.currentScene,
      adventurerRank: this.adventurerRank,
      adventurerExp: this.adventurerExp,
      adventurerExpToNext: this.adventurerExpToNext,
      currentQuest: this.currentQuest,
      questHistory: this.questHistory,
      generatedQuestIds: this.generatedQuestIds
    };

    await window.dzmm.kv.put(`rpg_save_slot_${slotId}`, JSON.stringify(saveData));
    this.saveSlots[slotId] = saveData;
    this.currentSlot = slotId;

    alert(`保存成功！存档槽位 #${slotId}`);
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败，请重试');
  }
}
```

#### 自定义内容持久化

**保存 (行 2497-2506):**

```javascript
async saveCustomContent() {
  try {
    await window.dzmm.kv.put('rpg_custom_items', JSON.stringify(this.customItems));
    await window.dzmm.kv.put('rpg_custom_enemies', JSON.stringify(this.customEnemies));
    await window.dzmm.kv.put('rpg_custom_equipment', JSON.stringify(this.customEquipment));
    console.log('自定义内容已保存');
  } catch (error) {
    console.error('保存自定义内容失败:', error);
  }
}
```

**加载 (行 2511-2534):**

```javascript
async loadCustomContent() {
  try {
    const items = await window.dzmm.kv.get('rpg_custom_items');
    const enemies = await window.dzmm.kv.get('rpg_custom_enemies');
    const equipment = await window.dzmm.kv.get('rpg_custom_equipment');

    if (items?.value) {
      this.customItems = JSON.parse(items.value);
      console.log(`加载${Object.keys(this.customItems).length}个自定义物品`);
    }

    if (enemies?.value) {
      this.customEnemies = JSON.parse(enemies.value);
      console.log(`加载${Object.keys(this.customEnemies).length}个自定义敌人`);
    }

    if (equipment?.value) {
      this.customEquipment = JSON.parse(equipment.value);
      console.log(`加载${Object.keys(this.customEquipment).length}个自定义装备`);
    }
  } catch (error) {
    console.warn('加载自定义内容失败:', error);
  }
}
```

### 4.5 React 实现建议

**文件：** `services/dzmm/storage.ts`

```typescript
export class DZMMStorage {
  /**
   * 保存数据到 KV 存储
   */
  static async save<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await window.dzmm.kv.put(key, serialized);
      console.log(`[DZMM Storage] Saved: ${key}`);
    } catch (error) {
      console.error(`[DZMM Storage] Save failed: ${key}`, error);
      throw error;
    }
  }

  /**
   * 从 KV 存储读取数据
   */
  static async load<T>(key: string): Promise<T | null> {
    try {
      const result = await window.dzmm.kv.get(key);
      if (!result.value) {
        console.log(`[DZMM Storage] No data found: ${key}`);
        return null;
      }
      const parsed = JSON.parse(result.value) as T;
      console.log(`[DZMM Storage] Loaded: ${key}`);
      return parsed;
    } catch (error) {
      console.error(`[DZMM Storage] Load failed: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除数据
   */
  static async remove(key: string): Promise<void> {
    try {
      await window.dzmm.kv.delete(key);
      console.log(`[DZMM Storage] Deleted: ${key}`);
    } catch (error) {
      console.error(`[DZMM Storage] Delete failed: ${key}`, error);
      throw error;
    }
  }
}
```

**文件：** `hooks/useDZMMStorage.ts`

```typescript
import { useState, useCallback } from 'react';
import { DZMMStorage } from '@/services/dzmm/storage';

export const useDZMMStorage = <T>(key: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await DZMMStorage.load<T>(key);
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载失败';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const save = useCallback(async (value: T) => {
    setLoading(true);
    setError(null);
    try {
      await DZMMStorage.save(key, value);
      setData(value);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存失败';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const remove = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await DZMMStorage.remove(key);
      setData(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除失败';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key]);

  return { data, loading, error, load, save, remove };
};
```

**使用示例：**

```typescript
// hooks/useSaveSlots.ts
import { useDZMMStorage } from './useDZMMStorage';

export const useSaveSlots = () => {
  const slot1 = useDZMMStorage<SaveData>('rpg_save_slot_1');
  const slot2 = useDZMMStorage<SaveData>('rpg_save_slot_2');
  const slot3 = useDZMMStorage<SaveData>('rpg_save_slot_3');

  const loadAllSlots = async () => {
    await Promise.all([
      slot1.load(),
      slot2.load(),
      slot3.load(),
    ]);
  };

  const saveToSlot = async (slotNumber: 1 | 2 | 3, data: SaveData) => {
    const slot = [slot1, slot2, slot3][slotNumber - 1];
    await slot.save({
      ...data,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
  };

  return {
    slots: [slot1.data, slot2.data, slot3.data],
    loading: slot1.loading || slot2.loading || slot3.loading,
    loadAllSlots,
    saveToSlot,
  };
};
```

---

## 5. dzmm.chat API

### 5.1 API 签名

```typescript
// 插入消息到对话树
window.dzmm.chat.insert(
  parentId: string | null,  // 父消息ID，null表示根节点
  messages: Message[]        // 要插入的消息数组
): Promise<{ ids: string[] }>;  // 返回新消息的ID数组

// 获取所有消息
window.dzmm.chat.list(): Promise<ChatMessage[]>;

// 获取指定消息的完整时间线
window.dzmm.chat.timeline(messageId: string): Promise<string[]>;  // 返回消息ID数组

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessage extends Message {
  id: string;
  timestamp: number;
  parent: string | null;
  children: string[];
}
```

### 5.2 使用策略

#### 历史消息管理配置

**源代码位置：** `alpinejs/fantasy.html` 行 893

```javascript
const GAME_CONFIG = {
  maxHistoryMessages: 15,  // 全局历史消息数量限制（关键修复，避免token超限）
  baseExpToLevel: 100,
  expGrowthRate: 1.5,
  fleeSuccessRate: 0.6,
  criticalRate: 0.15,
  restHealPercent: 0.3,
  maxSaveSlots: 3,
};
```

#### 上下文使用策略

| 场景 | 获取数量 | 代码位置 | 用途 |
|------|---------|---------|------|
| 故事生成 | 最近 5 条 | 行 1388-1389 | 保证叙事连贯性 |
| 任务提交 | 最近 3 条 | 行 2154 | 了解玩家行动 |
| 全局限制 | 最多 15 条 | 行 893 | 避免 token 超限 |

### 5.3 Alpine.js 原始实现

#### 保存对话到历史 (行 1359-1372)

```javascript
// 在 requestAI() 函数的步骤3
try {
  const toSave = [];
  if (context.userAction && context.userAction.trim()) {
    toSave.push({ role: 'user', content: context.userAction });
  }
  toSave.push({ role: 'assistant', content: storyContent });

  if (toSave.length > 0) {
    await window.dzmm.chat.insert(null, toSave);  // parentId 为 null
    console.log(`已保存${toSave.length}条消息`);
  }
} catch (saveError) {
  console.warn('保存消息失败:', saveError);
}
```

#### 获取最近 N 条历史 (行 1388-1389, 2318-2321)

```javascript
// 故事生成中获取最近5条历史
const allMessages = await window.dzmm.chat.list();
const recentMessages = allMessages.slice(-5);

// 通用工具函数
async getRecentHistory(count = 3) {
  const allMessages = await window.dzmm.chat.list();
  return allMessages.slice(-count);
}
```

#### 恢复剧情文本 (行 1267-1284)

```javascript
async restoreStoryText() {
  try {
    const messages = await window.dzmm.chat.list();
    if (messages && messages.length > 0) {
      // 从后往前找最后一条 assistant 消息
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          const parsed = this.parseAIResponse(messages[i].content);
          if (parsed.ready) {
            this.storyText = parsed.story;
            break;
          }
        }
      }
    }
  } catch (error) {
    console.warn('恢复剧情失败:', error);
  }
}
```

### 5.4 React 实现建议

**文件：** `services/dzmm/chat.ts`

```typescript
import { Message } from '@/types';

export class DZMMChat {
  /**
   * 保存消息到对话历史
   */
  static async saveMessages(messages: Message[]): Promise<string[]> {
    try {
      const result = await window.dzmm.chat.insert(null, messages);
      console.log(`[DZMM Chat] Saved ${messages.length} messages`);
      return result.ids;
    } catch (error) {
      console.error('[DZMM Chat] Save failed', error);
      throw error;
    }
  }

  /**
   * 获取所有消息
   */
  static async getAllMessages(): Promise<Message[]> {
    try {
      const messages = await window.dzmm.chat.list();
      console.log(`[DZMM Chat] Loaded ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('[DZMM Chat] Load failed', error);
      return [];
    }
  }

  /**
   * 获取最近 N 条消息
   */
  static async getRecentMessages(count: number): Promise<Message[]> {
    const allMessages = await this.getAllMessages();
    return allMessages.slice(-count);
  }

  /**
   * 清理历史消息（保留最近 N 条）
   * 注意：DZMM chat API 不支持删除，此方法仅用于获取限制后的消息
   */
  static async getCleanedHistory(maxCount: number = 15): Promise<Message[]> {
    const allMessages = await this.getAllMessages();
    if (allMessages.length <= maxCount) {
      return allMessages;
    }
    return allMessages.slice(-maxCount);
  }

  /**
   * 查找最后一条 assistant 消息
   */
  static async getLastAssistantMessage(): Promise<Message | null> {
    const messages = await this.getAllMessages();
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i];
      }
    }
    return null;
  }
}
```

**文件：** `hooks/useDZMMChat.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { DZMMChat } from '@/services/dzmm/chat';
import { Message } from '@/types';

export const useDZMMChat = (maxHistory: number = 15) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const allMessages = await DZMMChat.getCleanedHistory(maxHistory);
      setMessages(allMessages);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [maxHistory]);

  const saveMessage = useCallback(async (userInput: string, assistantResponse: string) => {
    try {
      const toSave: Message[] = [];

      if (userInput.trim()) {
        toSave.push({ role: 'user', content: userInput });
      }

      toSave.push({ role: 'assistant', content: assistantResponse });

      if (toSave.length > 0) {
        await DZMMChat.saveMessages(toSave);
        // 重新加载消息
        await loadMessages();
      }
    } catch (error) {
      console.error('保存消息失败:', error);
      throw error;
    }
  }, [loadMessages]);

  const getRecent = useCallback((count: number): Message[] => {
    return messages.slice(-count);
  }, [messages]);

  // 初始加载
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    loadMessages,
    saveMessage,
    getRecent,
  };
};
```

**使用示例：**

```typescript
// pages/GameInterface.tsx
import { useDZMMChat } from '@/hooks/useDZMMChat';

function GameInterface() {
  const { messages, saveMessage, getRecent } = useDZMMChat(15);

  const handleAction = async (action: string) => {
    // 获取最近5条历史用于生成
    const recentHistory = getRecent(5);

    // 构建提示词，包含历史消息
    const storyPrompt = buildStoryPrompt(action, gameState);
    const allMessages = [
      { role: 'user', content: storyPrompt },
      ...recentHistory,
      { role: 'user', content: action },
    ];

    // 生成故事
    const storyContent = await generateStory(allMessages);

    // 保存到历史
    await saveMessage(action, storyContent);
  };

  return <div>...</div>;
}
```

---

## 6. dzmm.draw API

### 6.1 API 签名

```typescript
window.dzmm.draw.generate(config: {
  prompt: string;           // 正面提示词（英文）
  negativePrompt: string;   // 负面提示词（英文）
  model: 'anime' | 'realistic';  // 模型类型
  dimension: '1:1' | '2:3' | '3:2' | '16:9';  // 图片比例
}): Promise<{ images: string[] }>;  // 返回图片 URL 数组
```

### 6.2 完整生成流程

**源代码位置：** `alpinejs/fantasy.html` 行 2833-2877

#### 步骤 1: 构建场景信息 (行 2879-2896)

```javascript
buildSceneInfo() {
  let targetInfo = '';

  if (this.artTarget === 'player') {
    const genderText = this.player.gender === 'male' ? 'male' : 'female';
    const appearanceText = this.player.appearance || 'no specific appearance';
    targetInfo = `Character: ${this.player.name}, Gender: ${genderText}, Class: ${this.player.className}, Appearance: ${appearanceText}`;
  } else if (this.artTarget === 'npc' && this.lastNPC) {
    targetInfo = `NPC: ${this.lastNPC}`;
  } else if (this.artTarget === 'enemy' && this.currentEnemy) {
    targetInfo = `Enemy: ${this.currentEnemy.name}`;
  }

  const sceneText = this.storyText.replace(/<[^>]*>/g, '').substring(0, 500);
  const customReq = this.artRequirement || 'no specific requirement';

  return `${targetInfo}\nCurrent scene: ${sceneText}\nCustom requirement: ${customReq}`;
}
```

#### 步骤 2: 生成英文提示词 (行 2923-2928)

使用 `dzmm.completions` API 调用 responseModel，将中文场景信息转换为英文 SD 提示词。

> 详细提示词模板见《提示词工程文档.md》第 2.5 节

#### 步骤 3: 拼接质量词 (行 2849-2850, 947-948)

```javascript
// 质量词常量
const QUALITY_TAGS = 'artist:takeuchi_takashi, wanke, rella, (artist:okyou:0.4), (artist:askzy:0.3), (artist:quasarcake:0.3), (artist:wlop:0.3), (artist:nixeu:0.3), masterpiece, best quality, amazing quality, very aesthetic, absurdres, highres, newest, extreme aesthetic, year 2024, year 2023, (Visual impact:1.2), ultra-high resolution, 32K UHD, 6669, GFGoddess, unconventional supreme masterpiece, masterful details, regal atmosphere, high-end texture, fashion photography style, impactful picture, official art, movie perspective';

// 负面提示词常量
const NEGATIVE_PROMPT = 'lowres, bad anatomy, bad hands, text, error, missing fingers, worst quality, low quality, jpeg artifacts, watermark, blurry, multiple views, bad proportions, deformed, ugly, duplicate, mutilated, extra limbs, fused fingers, too many fingers, long neck, cross-eyed';

// 拼接
const fullPrompt = `${prompt}, ${QUALITY_TAGS}`;
```

#### 步骤 4: 调用绘图 API (行 2854-2859)

```javascript
const result = await window.dzmm.draw.generate({
  prompt: fullPrompt,
  negativePrompt: NEGATIVE_PROMPT,
  model: 'anime',      // 固定使用 anime 模型
  dimension: '2:3'     // 竖版比例
});
```

#### 步骤 5: 保存到画廊 (行 2861-2867, 2960-2977)

```javascript
if (result.images && result.images.length > 0) {
  await this.saveToGallery(result.images[0], this.getTargetName(), prompt);
  alert('生成成功！已保存到画廊');
  this.showArtGenerator = false;
  this.artRequirement = '';
}

// saveToGallery 方法
async saveToGallery(imageUrl, target, prompt) {
  const imageData = {
    id: `img-${Date.now()}`,
    url: imageUrl,
    target,
    prompt,
    timestamp: new Date().toLocaleString('zh-CN')
  };

  this.gallery.push(imageData);

  try {
    await window.dzmm.kv.put('rpg_gallery', JSON.stringify(this.gallery));
  } catch (error) {
    console.warn('保存画廊失败:', error);
  }
}
```

### 6.3 React 实现建议

**文件：** `services/dzmm/draw.ts`

```typescript
export const QUALITY_TAGS = 'masterpiece, best quality, amazing quality, very aesthetic, absurdres, highres';

export const NEGATIVE_PROMPT = 'lowres, bad anatomy, bad hands, text, error, missing fingers, worst quality, low quality, jpeg artifacts, watermark, blurry';

export interface DrawConfig {
  prompt: string;
  model?: 'anime' | 'realistic';
  dimension?: '1:1' | '2:3' | '3:2' | '16:9';
}

export const generateImage = async ({
  prompt,
  model = 'anime',
  dimension = '2:3',
}: DrawConfig): Promise<string[]> => {
  try {
    const fullPrompt = `${prompt}, ${QUALITY_TAGS}`;

    const result = await window.dzmm.draw.generate({
      prompt: fullPrompt,
      negativePrompt: NEGATIVE_PROMPT,
      model,
      dimension,
    });

    console.log(`[DZMM Draw] Generated ${result.images.length} images`);
    return result.images;
  } catch (error) {
    console.error('[DZMM Draw] Generation failed', error);
    throw error;
  }
};
```

**文件：** `hooks/useImageGeneration.ts`

```typescript
import { useState } from 'react';
import { generateImage, DrawConfig } from '@/services/dzmm/draw';
import { DZMMStorage } from '@/services/dzmm/storage';
import { GalleryImage } from '@/types';

export const useImageGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    sceneInfo: string,
    target: string,
    customRequirement?: string
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // 步骤1: 生成英文提示词（调用 completions）
      const promptText = await generatePromptFromScene(sceneInfo, customRequirement);

      // 步骤2: 调用绘图 API
      const images = await generateImage({ prompt: promptText });

      if (images.length === 0) {
        throw new Error('未生成图片');
      }

      // 步骤3: 保存到画廊
      const imageUrl = images[0];
      await saveToGallery(imageUrl, target, promptText);

      return imageUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失败';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = async (url: string, target: string, prompt: string) => {
    const gallery = await DZMMStorage.load<GalleryImage[]>('rpg_gallery') || [];

    const newImage: GalleryImage = {
      id: `img-${Date.now()}`,
      url,
      target,
      prompt,
      timestamp: new Date().toLocaleString('zh-CN'),
    };

    gallery.push(newImage);
    await DZMMStorage.save('rpg_gallery', gallery);
  };

  return { loading, error, generate };
};
```

---

## 7. 双模型架构实现

### 7.1 模型配置 UI

**Alpine.js 原始代码：** `alpinejs/fantasy.html` 行 60-96

```html
<!-- 正文模型选择 -->
<div class="model-selection">
  <label>正文模型（生成故事）：</label>
  <select x-model="$store.rpg.storyModel">
    <option value="nalang-turbo-0826">Turbo (快速)</option>
    <option value="nalang-medium-0826">Medium (平衡)</option>
    <option value="nalang-max-0826">Max (强大)</option>
    <option value="nalang-xl-0826">XL (稳定)</option>
    <option value="nalang-max-0826-16k">Max-16K (快速强大)</option>
    <option value="nalang-xl-0826-16k">XL-16K (快速稳定)</option>
  </select>
</div>

<!-- 响应模型选择 -->
<div class="model-selection">
  <label>响应模型（处理数据）：</label>
  <select x-model="$store.rpg.responseModel">
    <option value="nalang-turbo-0826">Turbo (快速)</option>
    <option value="nalang-medium-0826">Medium (平衡)</option>
    <option value="nalang-max-0826">Max (强大)</option>
    <option value="nalang-xl-0826">XL (稳定)</option>
    <option value="nalang-max-0826-16k">Max-16K (快速强大)</option>
    <option value="nalang-xl-0826-16k">XL-16K (快速稳定)</option>
  </select>
  <small style="color: rgba(255,255,255,0.6);">
    响应模型用于解析正文并更新游戏数据，建议使用Medium/XL以确保数据准确性
  </small>
</div>
```

**React 实现 (WelcomeScreen.tsx):**

```typescript
import { useDZMMContext } from '@/contexts/DZMMContext';

const MODEL_OPTIONS = [
  { value: 'nalang-turbo-0826', label: 'Turbo (快速)' },
  { value: 'nalang-medium-0826', label: 'Medium (平衡)' },
  { value: 'nalang-max-0826', label: 'Max (强大)' },
  { value: 'nalang-xl-0826', label: 'XL (稳定)' },
  { value: 'nalang-max-0826-16k', label: 'Max-16K (快速强大)' },
  { value: 'nalang-xl-0826-16k', label: 'XL-16K (快速稳定)' },
];

function WelcomeScreen() {
  const { storyModel, responseModel, setStoryModel, setResponseModel } = useDZMMContext();

  return (
    <div>
      <div className="model-selection">
        <label>正文模型（生成故事）：</label>
        <select value={storyModel} onChange={(e) => setStoryModel(e.target.value)}>
          {MODEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="model-selection">
        <label>响应模型（处理数据）：</label>
        <select value={responseModel} onChange={(e) => setResponseModel(e.target.value)}>
          {MODEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <small className="text-muted">
          响应模型用于解析正文并更新游戏数据，建议使用 Medium/XL 以确保数据准确性
        </small>
      </div>
    </div>
  );
}
```

### 7.2 双模型协作流程

**源代码位置：** `alpinejs/fantasy.html` 行 1335-1380

```javascript
async requestAI(action, context = {}) {
  this.actionLocked = true;
  this.storyText = '<span class="loading">正在生成故事...</span>';

  try {
    // ===== 步骤1：调用正文模型生成叙事 =====
    const storyContent = await this.generateStory(action, context);

    if (!storyContent) {
      throw new Error('正文生成失败');
    }

    // 显示生成的正文
    this.storyText = storyContent;

    // ===== 步骤2：调用响应模型解析正文并更新数据 =====
    this.storyText = storyContent + '<br><span class="loading" style="font-size: 12px; color: #ffd43b;">正在更新游戏数据...</span>';

    await this.parseStoryAndUpdate(storyContent, action, context);

    // 移除加载提示
    this.storyText = storyContent;

    // ===== 步骤3：保存到chat历史 =====
    try {
      const toSave = [];
      if (context.userAction && context.userAction.trim()) {
        toSave.push({ role: 'user', content: context.userAction });
      }
      toSave.push({ role: 'assistant', content: storyContent });

      if (toSave.length > 0) {
        await window.dzmm.chat.insert(null, toSave);
        console.log(`已保存${toSave.length}条消息`);
      }
    } catch (saveError) {
      console.warn('保存消息失败:', saveError);
    }

  } catch (error) {
    console.error('AI请求失败:', error);
    this.storyText = `<p style="color: #ff4444;">❌ 请求失败: ${error.message}</p>`;
  } finally {
    this.actionLocked = false;
  }
}
```

**协作优势：**
1. **职责分离**：叙事生成与数据处理分离，各司其职
2. **流式体验**：故事立即显示，数据后台更新，提升用户体验
3. **容错性**：数据解析失败不影响故事显示
4. **灵活性**：可以选择不同模型组合（例如：正文用 XL，解析用 Medium）

**React 实现建议：**

```typescript
// hooks/useGameAction.ts
import { useDZMMCompletion } from './useDZMMCompletion';
import { useDZMMContext } from '@/contexts/DZMMContext';
import { useGameDataParser } from './useGameDataParser';
import { useDZMMChat } from './useDZMMChat';

export const useGameAction = () => {
  const { storyModel, responseModel } = useDZMMContext();
  const storyGen = useDZMMCompletion();
  const { parseAndUpdate } = useGameDataParser();
  const { saveMessage } = useDZMMChat();

  const [actionLocked, setActionLocked] = useState(false);
  const [storyText, setStoryText] = useState('');

  const executeAction = async (action: string, context: ActionContext) => {
    setActionLocked(true);
    setStoryText('正在生成故事...');

    try {
      // 步骤1: 生成故事
      const storyContent = await storyGen.generate(
        storyModel,
        buildStoryMessages(action, context),
        1000
      );

      if (!storyContent) {
        throw new Error('正文生成失败');
      }

      setStoryText(storyContent);

      // 步骤2: 解析数据（后台进行）
      await parseAndUpdate(storyContent, gameState);

      // 步骤3: 保存历史
      await saveMessage(context.userAction || '', storyContent);

    } catch (error) {
      console.error('AI请求失败:', error);
      setStoryText(`❌ 请求失败: ${error.message}`);
    } finally {
      setActionLocked(false);
    }
  };

  return { actionLocked, storyText, executeAction };
};
```

---

## 8. 错误处理和最佳实践

### 8.1 错误处理

#### try-catch 包装

**所有 DZMM API 调用都应包装在 try-catch 中：**

```typescript
try {
  const result = await window.dzmm.completions({ ... }, callback);
} catch (error) {
  console.error('API 调用失败:', error);
  // 向用户显示友好的错误消息
  setError('生成失败，请重试');
}
```

#### 重试机制（指数退避）

**文件：** `utils/retry.ts`

```typescript
export const retryWithBackoff = async <T>(
  asyncFunc: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await asyncFunc();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      console.warn(`请求失败，${delay / 1000}秒后重试 (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('重试次数已用尽');
};
```

**使用示例：**

```typescript
const generateStory = async (messages: Message[]) => {
  return retryWithBackoff(
    () => generateCompletion({ model, messages, maxTokens: 1000 }),
    3,  // 最多重试3次
    1000  // 初始延迟1秒
  );
};
```

#### 并发请求锁

**文件：** `utils/requestLock.ts`

```typescript
class RequestLock {
  private locks = new Map<string, Promise<any>>();

  async withLock<T>(key: string, asyncFunc: () => Promise<T>): Promise<T> {
    // 如果已有相同请求在进行，返回该请求
    if (this.locks.has(key)) {
      console.log(`[RequestLock] 等待现有请求: ${key}`);
      return this.locks.get(key)!;
    }

    // 创建新请求
    const promise = asyncFunc();
    this.locks.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.locks.delete(key);
    }
  }
}

export const requestLock = new RequestLock();
```

**使用示例：**

```typescript
const handleAction = async (action: string) => {
  return requestLock.withLock(`action-${action}`, async () => {
    // 实际的 API 调用逻辑
    const result = await generateStory(...);
    return result;
  });
};
```

### 8.2 最佳实践

#### 1. 历史消息限制

```typescript
const GAME_CONFIG = {
  maxHistoryMessages: 15,     // 全局历史限制
  storyHistoryCount: 5,       // 故事生成用
  questHistoryCount: 3,       // 任务提交用
};

// 获取历史时始终限制数量
const recentMessages = allMessages.slice(-GAME_CONFIG.storyHistoryCount);
```

#### 2. 消息清洗

```typescript
// 移除特殊标记，避免 AI 格式惯性
const cleanMessage = (content: string): string => {
  return content
    .replace(/###DATA[\s\S]*?###END/g, '')
    .replace(/###NEW[\s\S]*?###END/g, '')
    .replace(/###RESULT[\s\S]*?###END/g, '')
    .trim();
};

const cleanedHistory = messages.map(msg => ({
  role: msg.role,
  content: cleanMessage(msg.content),
}));
```

#### 3. Loading 状态管理

```typescript
// 使用细粒度的 loading 状态
const [loadingStates, setLoadingStates] = useState({
  story: false,
  parse: false,
  save: false,
});

const setLoading = (key: keyof typeof loadingStates, value: boolean) => {
  setLoadingStates(prev => ({ ...prev, [key]: value }));
};

// 显示不同阶段的加载状态
{loadingStates.story && <LoadingText>正在生成故事...</LoadingText>}
{loadingStates.parse && <LoadingText>正在更新游戏数据...</LoadingText>}
```

#### 4. 结构化日志

```typescript
const logAPICall = (apiName: string, params: any, result?: any, error?: any) => {
  console.group(`[DZMM API] ${apiName}`);
  console.log('参数:', params);
  if (result) console.log('结果:', result);
  if (error) console.error('错误:', error);
  console.groupEnd();
};

// 使用示例
try {
  const result = await window.dzmm.completions(config, callback);
  logAPICall('completions', config, result);
} catch (error) {
  logAPICall('completions', config, undefined, error);
}
```

#### 5. 数据版本控制

```typescript
// 在存储的数据中包含版本号
interface SaveData {
  version: string;  // 例如: "2.0"
  // ... 其他字段
}

// 读取时检查版本并迁移
const loadSaveData = async (key: string): Promise<SaveData | null> => {
  const data = await DZMMStorage.load<SaveData>(key);
  if (!data) return null;

  // 版本迁移逻辑
  if (data.version === '1.0') {
    return migrateV1ToV2(data);
  }

  return data;
};
```

---

## 9. 完整代码示例

### 9.1 服务层封装

**文件：** `services/dzmm/index.ts`

```typescript
export { DZMMStorage } from './storage';
export { DZMMChat } from './chat';
export { generateCompletion } from './completions';
export { generateImage, QUALITY_TAGS, NEGATIVE_PROMPT } from './draw';

// 统一导出所有 DZMM 服务
export const DZMM = {
  storage: DZMMStorage,
  chat: DZMMChat,
  completions: { generate: generateCompletion },
  draw: { generate: generateImage },
};
```

### 9.2 Hooks 层

**文件：** `hooks/useDZMM.ts`

```typescript
export { useDZMM } from './useDZMM';
export { useDZMMContext } from '@/contexts/DZMMContext';
export { useDZMMCompletion } from './useDZMMCompletion';
export { useDZMMStorage } from './useDZMMStorage';
export { useDZMMChat } from './useDZMMChat';
```

### 9.3 Context 全局状态

**文件：** `contexts/DZMMContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface DZMMContextValue {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  storyModel: string;
  responseModel: string;
  setStoryModel: (model: string) => void;
  setResponseModel: (model: string) => void;
}

const DZMMContext = createContext<DZMMContextValue | undefined>(undefined);

export const DZMMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyModel, setStoryModel] = useState('nalang-xl-0826-16k');
  const [responseModel, setResponseModel] = useState('nalang-xl-0826-16k');

  useEffect(() => {
    // 通知父窗口准备就绪
    if (window.parent !== window) {
      window.parent.postMessage('iframe:content-ready', '*');
    }

    let isResolved = false;

    const checkDZMM = () => {
      if (window.dzmm && !isResolved) {
        isResolved = true;
        setIsReady(true);
        setIsLoading(false);
      }
    };

    checkDZMM();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'dzmm:ready') {
        checkDZMM();
      }
    };

    window.addEventListener('message', handleMessage);

    const timeoutId = setTimeout(() => {
      checkDZMM();
      if (!isResolved) {
        setIsLoading(false);
        setError('DZMM API 初始化超时');
      }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <DZMMContext.Provider
      value={{
        isReady,
        isLoading,
        error,
        storyModel,
        responseModel,
        setStoryModel,
        setResponseModel,
      }}
    >
      {children}
    </DZMMContext.Provider>
  );
};

export const useDZMMContext = () => {
  const context = useContext(DZMMContext);
  if (!context) {
    throw new Error('useDZMMContext must be used within DZMMProvider');
  }
  return context;
};
```

### 9.4 完整使用示例

**文件：** `pages/GameInterface.tsx`

```typescript
import React, { useState } from 'react';
import { useDZMMContext } from '@/contexts/DZMMContext';
import { useDZMMCompletion } from '@/hooks/useDZMMCompletion';
import { useDZMMChat } from '@/hooks/useDZMMChat';
import { useGameDataParser } from '@/hooks/useGameDataParser';
import { buildStoryPrompt } from '@/utils/promptBuilder';

function GameInterface() {
  const { storyModel, responseModel } = useDZMMContext();
  const { content, generate } = useDZMMCompletion();
  const { saveMessage, getRecent } = useDZMMChat();
  const { parseAndUpdate } = useGameDataParser();

  const [gameState, setGameState] = useState<GameState>({...});
  const [actionLocked, setActionLocked] = useState(false);

  const handlePlayerAction = async (action: string, userInput: string) => {
    setActionLocked(true);

    try {
      // 步骤1: 生成故事
      const recentHistory = getRecent(5);
      const storyPrompt = buildStoryPrompt(action, gameState);

      const messages = [
        { role: 'user', content: storyPrompt },
        ...recentHistory,
        { role: 'user', content: userInput },
      ];

      const storyContent = await generate(storyModel, messages, 1000);

      // 步骤2: 解析数据
      await parseAndUpdate(storyContent, gameState);

      // 步骤3: 保存历史
      await saveMessage(userInput, storyContent);

    } catch (error) {
      console.error('行动执行失败:', error);
      alert('操作失败，请重试');
    } finally {
      setActionLocked(false);
    }
  };

  return (
    <div className="game-interface">
      <StoryDisplay content={content} />
      <ActionPanel
        onAction={handlePlayerAction}
        locked={actionLocked}
        gameState={gameState}
      />
    </div>
  );
}
```

---

## 10. 类型定义

**文件：** `types/dzmm.d.ts`

```typescript
declare global {
  interface Window {
    dzmm: {
      completions: (
        config: {
          model: string;
          messages: Array<{ role: 'user' | 'assistant'; content: string }>;
          maxTokens?: number;
        },
        callback: (content: string, done: boolean) => void
      ) => Promise<void>;

      kv: {
        get: (key: string) => Promise<{ value: string | null }>;
        put: (key: string, value: string) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };

      chat: {
        insert: (
          parentId: string | null,
          messages: Array<{ role: 'user' | 'assistant'; content: string }>
        ) => Promise<{ ids: string[] }>;
        list: () => Promise<Array<{
          id: string;
          role: 'user' | 'assistant';
          content: string;
          timestamp: number;
          parent: string | null;
          children: string[];
        }>>;
        timeline: (messageId: string) => Promise<string[]>;
      };

      draw: {
        generate: (config: {
          prompt: string;
          negativePrompt: string;
          model: 'anime' | 'realistic';
          dimension: '1:1' | '2:3' | '3:2' | '16:9';
        }) => Promise<{ images: string[] }>;
      };
    };
  }
}

export {};
```

---

## 11. 总结

### 关键要点

1. **DZMM API 是异步的**，所有调用都返回 Promise
2. **completions API 使用流式回调**，`content` 是累积内容
3. **KV 存储仅支持字符串**，需要手动序列化/反序列化
4. **chat API 管理对话树**，支持分支但本项目仅用线性历史
5. **双模型架构**提供职责分离，但可以用单模型简化

### 迁移检查清单

- [ ] DZMM 初始化和就绪检测
- [ ] completions API 7 个场景的实现
- [ ] KV 存储的 5 种数据类型
- [ ] chat API 的历史管理策略
- [ ] draw API 的完整流程
- [ ] 双模型配置 UI
- [ ] 错误处理和重试机制
- [ ] 并发请求锁
- [ ] 类型定义文件

### 下一步

请参考《提示词工程文档.md》，获取所有 AI 角色定义、提示词模板和结构化输出格式的完整说明。

---

**文档版本：** 1.0
**最后更新：** 2025-11-23
**维护者：** Claude Code Migration Team
