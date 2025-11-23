# 背包交互系统

## 🎮 用户交互流程

### 1️⃣ 点击物品 → 操作菜单
用户点击背包中的任何物品，会弹出操作菜单（底部滑入式，移动端友好）：

```
┌─────────────────────────┐
│  [图标] 治愈药水        │
│         Consumable      │
├─────────────────────────┤
│ [📖 查看详情] [✨ 使用] │
└─────────────────────────┘
```

### 2️⃣ 查看详情 → 百科卡片
点击"查看详情"会弹出物品百科卡片，显示：
- **大图标**（带稀有度渐变背景）
- **物品名称**
- **类型标签** + **稀有度标签**
- **完整描述**（从 `constants.ts` 的 `ALL_ITEMS` 硬编码）
- **操作按钮**：返回 / 使用

```
┌───────────────────────────┐
│         [大图标]          │
│                           │
│       治愈药水            │
│   [Consumable] [Common]   │
│                           │
│ ┌─────────────────────┐   │
│ │ 恢复50点生命值。    │   │
│ │ 尝起来像樱桃味。    │   │
│ └─────────────────────┘   │
│                           │
│  [返回]      [✨ 使用]    │
└───────────────────────────┘
```

### 3️⃣ 使用物品 → 自动填充消息
点击"使用"会：
1. ✅ 关闭所有弹窗（操作菜单 + 详情卡片）
2. ✅ 关闭背包界面
3. ✅ 返回游戏主界面
4. ✅ 自动填充输入框：`"我使用了[物品名称]"`
5. ⚠️ **不会自动发送** - 让用户确认后手动发送

**示例**：
```
用户点击"使用" → 输入框自动填充："我使用了治愈药水"
用户按发送 → AI收到消息并进行叙述
```

---

## 💻 技术实现

### **组件状态管理**
```typescript
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
const [showDetail, setShowDetail] = useState(false);
```

- `selectedItem`: 当前选中的物品（null = 未选中）
- `showDetail`: 是否显示详情卡片（false = 显示操作菜单）

### **交互逻辑**
```typescript
// 点击物品卡片
onClick={() => setSelectedItem(item)}

// 点击"查看详情"
onClick={() => setShowDetail(true)}

// 点击"使用"
const handleUse = (itemName: string) => {
  setSelectedItem(null);    // 关闭操作菜单
  setShowDetail(false);     // 关闭详情卡片
  onUseItem(itemName);      // 回调到GameInterface
};
```

### **回调到游戏界面**
```typescript
// GameInterface.tsx 中
<InventorySheet
  items={character.inventory}
  onUseItem={(itemName) => {
    setActiveSheet(null);           // 关闭背包界面
    setInput(`我使用了${itemName}`); // 填充输入框
  }}
/>
```

---

## 🎨 UI设计特点

### **操作菜单**
- **移动端**：从底部滑入（`items-end`）
- **桌面端**：居中弹出（`items-center`）
- **响应式宽度**：移动端全屏，桌面端固定400px

### **详情卡片**
- **背景模糊**：`backdrop-blur-sm`
- **稀有度颜色**：
  - Common: 灰色渐变
  - Rare: 蓝色渐变
  - Legendary: 紫色渐变
- **动画**：`scale(0.9 → 1.0)` 弹出效果

### **物品卡片动画**
- **悬停**：`scale: 1.03`
- **点击**：`scale: 0.98`
- **图标放大**：`group-hover:scale-110`

---

## 📋 系统设计原则

### ✅ 保持简洁
1. **程序硬编码** - 所有物品信息来自 `constants.ts`，AI完全不感知
2. **仅2个操作** - 查看 / 使用，不引入复杂交互
3. **无需后端验证** - 物品使用由AI判断是否合理，程序只负责传递消息

### ✅ AI集成方式
- **使用物品** = 发送消息"我使用了XXX"
- AI根据物品名称和游戏上下文自由叙述效果
- AI可以拒绝不合理的使用（例如："你手中没有那个物品"）

### ✅ 未来扩展
如果需要程序级别的物品效果验证（例如：药水必须消耗），可以：
1. 在 `constants.ts` 中为每个物品添加 `consumable: boolean`
2. 在 `onUseItem` 回调中检测并调用 `removeItem(itemId)`
3. 当前版本暂不实现，保持灵活性

---

## 🔧 维护指南

### 添加新物品
1. 在 `constants.ts` 的 `ALL_ITEMS` 中定义
2. 使用已有的16个图标之一
3. 填写完整的 `description`（这会显示在详情卡片中）

### 修改UI样式
- 操作菜单：`GameInterface.tsx` 第816-860行
- 详情卡片：`GameInterface.tsx` 第862-930行
- 物品卡片：`GameInterface.tsx` 第785-811行

---

## 📊 性能影响

- **Bundle增加**: +3.5 KB (79.56 KB → 83.22 KB)
- **运行时开销**: 最小（仅本地状态管理，无网络请求）
- **用户体验**: 流畅（使用 Framer Motion 动画）
