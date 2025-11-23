# 物品数量堆叠系统

## 📦 系统概述

只有**消耗品（Consumable）**需要数量管理，其他类型物品（装备、素材、关键物品）不计数。

### 核心原则：
1. ✅ **程序控制** - 数量增减由程序自动管理
2. ✅ **使用消耗** - 使用消耗品时 quantity - 1
3. ✅ **自动移除** - quantity = 0 时自动从背包移除
4. ✅ **UI显示** - 数量徽章显示在卡片右下角

---

## 🔧 技术实现

### 1️⃣ **数据结构**

```typescript
// types.ts
export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'Consumable' | 'Equipment' | 'Material' | 'Key';
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  quantity?: number; // 仅用于消耗品（Consumable）
}
```

### 2️⃣ **创建物品实例**

```typescript
// constants.ts
export function getItemInstance(itemKey: keyof typeof ALL_ITEMS, quantity?: number): Item {
  const template = ALL_ITEMS[itemKey];
  const item: Item = {
    ...template,
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  // 仅为消耗品设置数量
  if (template.type === 'Consumable') {
    item.quantity = quantity ?? 1; // 默认数量为1
  }

  return item;
}
```

### 3️⃣ **初始物品配置**

```typescript
// constants.ts
const STARTING_ITEMS_CONFIG: Record<ClassType, Array<{ key: keyof typeof ALL_ITEMS; qty?: number }>> = {
  [ClassType.ALCHEMIST]: [
    { key: 'POTION', qty: 3 },    // 治愈药水 ×3
    { key: 'BREAD', qty: 5 },     // 旅行干粮 ×5
    { key: 'BOOK' }               // 笔记本 (不计数)
  ],
  // ... 其他职业
};

export function getStartingInventory(classType: ClassType): Item[] {
  return STARTING_ITEMS_CONFIG[classType].map(({ key, qty }) => getItemInstance(key, qty));
}
```

**初始物品数量**：
- 炼金术士：药水×3 + 干粮×5 + 笔记本
- 骑士：长剑 + 盾牌 + 干粮×5
- 碧空海盗：长剑 + 金币×10 + 干粮×5
- 遗迹学者：木杖 + 笔记本 + 干粮×5

### 4️⃣ **使用物品逻辑**

```typescript
// GameContext.tsx
const useItem = (itemId: string) => {
  setCharacter(prev => {
    if (!prev) return prev;

    const updatedInventory = prev.inventory
      .map(item => {
        if (item.id === itemId && item.type === 'Consumable' && item.quantity) {
          const newQuantity = item.quantity - 1;
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter(item => {
        // Remove items with quantity 0
        if (item.type === 'Consumable' && item.quantity !== undefined) {
          return item.quantity > 0;
        }
        return true;
      });

    return { ...prev, inventory: updatedInventory };
  });
};
```

**工作流程**：
1. 找到匹配的消耗品
2. quantity - 1
3. 如果 quantity = 0，从背包移除
4. 更新角色状态

### 5️⃣ **使用物品完整流程**

```typescript
// GameInterface.tsx
{activeSheet === 'INVENTORY' && <InventorySheet
  items={character.inventory}
  onUseItem={(itemId, itemName) => {
    // 1. 减少数量（或移除物品）
    useItem(itemId);

    // 2. 关闭背包界面
    setActiveSheet(null);

    // 3. 填充输入框
    setInput(`我使用了${itemName}`);
  }}
/>}
```

---

## 🎨 UI展示

### **物品卡片 - 数量徽章**
```jsx
{/* 右下角数量徽章 */}
{item.type === 'Consumable' && item.quantity && (
  <div className="absolute bottom-2 right-2 bg-[#5D4037] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
    ×{item.quantity}
  </div>
)}
```

**效果**：
```
┌─────────────┐
│   [图标]    │
│             │
│  治愈药水   │  ×3  ← 数量徽章
│ Consumable  │
└─────────────┘
```

### **详情卡片 - 数量标签**
```jsx
{selectedItem.type === 'Consumable' && selectedItem.quantity && (
  <span className="px-3 py-1 bg-[#FFD166] text-[#5D4037] text-xs font-bold rounded-full">
    数量: {selectedItem.quantity}
  </span>
)}
```

**效果**：
```
      [大图标] ×3  ← 徽章

     治愈药水

[Consumable] [Common] [数量: 3]  ← 标签
```

---

## 🔄 数量变化示例

### **场景 1：使用药水（3 → 2）**
```
初始状态：
背包: [治愈药水 ×3]

用户点击"使用" →
程序: useItem(item_potion_xxx) → quantity - 1

结果状态：
背包: [治愈药水 ×2]
输入框: "我使用了治愈药水"
```

### **场景 2：使用最后一个（1 → 0）**
```
初始状态：
背包: [治愈药水 ×1, 干粮 ×5]

用户使用最后一个药水 →
程序: useItem(item_potion_xxx) → quantity - 1 = 0 → 移除

结果状态：
背包: [干粮 ×5]  ← 药水已自动移除
输入框: "我使用了治愈药水"
```

### **场景 3：装备不计数**
```
初始状态：
背包: [长剑, 盾牌]

用户"使用"长剑 →
程序: useItem(item_sword_xxx) → 不是消耗品，quantity不变

结果状态：
背包: [长剑, 盾牌]  ← 装备仍在背包
输入框: "我使用了制式长剑"  ← AI自行判断效果
```

---

## ⚙️ 添加消耗品功能（未来扩展）

如果需要通过程序添加消耗品并堆叠：

```typescript
// GameContext.tsx (未来扩展)
const addItem = (item: Item) => {
  setCharacter(prev => {
    if (!prev) return prev;

    // 如果是消耗品，检查是否已存在相同模板ID的物品
    if (item.type === 'Consumable') {
      const existingIndex = prev.inventory.findIndex(
        i => i.type === 'Consumable' &&
             i.name === item.name // 或使用模板ID
      );

      if (existingIndex !== -1) {
        // 堆叠：增加数量
        const updatedInventory = [...prev.inventory];
        updatedInventory[existingIndex] = {
          ...updatedInventory[existingIndex],
          quantity: (updatedInventory[existingIndex].quantity || 1) + (item.quantity || 1)
        };
        return { ...prev, inventory: updatedInventory };
      }
    }

    // 不堆叠或非消耗品：添加新条目
    return { ...prev, inventory: [...prev.inventory, item] };
  });
};
```

**当前版本不实现堆叠添加，仅实现使用消耗功能。**

---

## 📊 数据存储

### **存档数据结构**
```json
{
  "character": {
    "inventory": [
      {
        "id": "item_potion_1732380000123_abc123",
        "name": "治愈药水",
        "type": "Consumable",
        "quantity": 3,  ← 保存数量
        "rarity": "Common",
        "icon": "https://..."
      },
      {
        "id": "item_sword_1732380000456_def456",
        "name": "制式长剑",
        "type": "Equipment",
        // 无 quantity 字段
        "rarity": "Common",
        "icon": "https://..."
      }
    ]
  }
}
```

---

## 🛡️ 边界情况处理

### ❌ **情况 1：使用不存在的物品**
```typescript
// 程序：找不到itemId，map不匹配任何物品，inventory不变
// AI：可以叙述"你的背包里没有那个物品"
```

### ❌ **情况 2：使用非消耗品**
```typescript
// 程序：非Consumable，不减少quantity，物品保留
// AI：自由判断效果（装备、阅读书籍等）
```

### ✅ **情况 3：quantity已经为0（不应发生）**
```typescript
// filter会移除quantity=0的物品，不会显示在UI中
// 理论上用户无法点击到
```

---

## 📈 性能影响

- **Bundle增加**: +1 KB (83.22 KB → 84.21 KB)
- **运行时开销**: 最小（仅本地状态更新）
- **存档大小**: +4 bytes per consumable (quantity字段)

---

## 🔧 维护指南

### **添加新消耗品**
1. 在 `constants.ts` 的 `ALL_ITEMS` 中定义，确保 `type: 'Consumable'`
2. 在 `STARTING_ITEMS_CONFIG` 中设置初始数量：`{ key: 'NEW_ITEM', qty: 5 }`
3. 无需其他修改，系统自动处理数量

### **调整初始数量**
```typescript
// constants.ts
[ClassType.ALCHEMIST]: [
  { key: 'POTION', qty: 3 },  // 修改这里
  { key: 'BREAD', qty: 5 },   // 修改这里
]
```

### **修改数量显示样式**
- 物品卡片徽章：`GameInterface.tsx` 第820-824行
- 详情卡片标签：`GameInterface.tsx` 第927-931行

---

## 🎯 总结

### ✅ 已实现功能
- ✅ 消耗品带数量字段
- ✅ 初始物品设置数量（药水×3，干粮×5）
- ✅ 使用物品时 quantity - 1
- ✅ quantity = 0 时自动移除
- ✅ UI显示数量徽章和标签

### ⏸️ 未实现功能（保持简洁）
- ⏸️ 添加物品时自动堆叠（未来扩展）
- ⏸️ AI指令添加物品（未来扩展）
- ⏸️ 物品分解/合并（未来扩展）

**系统设计简洁、清晰，数量管理完全由程序控制，AI无需感知！** 🎮
