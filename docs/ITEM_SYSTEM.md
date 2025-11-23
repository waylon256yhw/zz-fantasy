# 物品系统使用说明

## 📦 核心原则

**所有物品都必须在 `constants.ts` 的 `ALL_ITEMS` 中预定义，不允许运行时动态创建新物品！**

这是为了：
1. 确保所有物品都有对应的图标资源
2. 避免AI生成不存在的物品
3. 保持物品数据的一致性和可维护性

---

## 🎨 可用图标资源

当前可用图标（来自 R2 存储桶）：  
共 64 张，全部在 `constants.ts` 的 `IMAGES.icons` 中，已按语义分组便于挑选

- 基础/遗留：book, diamond, fight, fire, goblin, gold, house, knight, potion, shield, skull, sword, treasure, trunk, wand, wings
- 食物/饮品：apple, bread, beer, berries, cake, croissant, fish, juice, kebab, loaf, meat, pancakes, pie, ramen, rice, stew, sushi, tart
- 日用品/工具：banner, compass, goblet, key, scroll, stones
- 武器/装备：boots, crossbow, quiver
- 探索/采集/奥术：herbs, orb, purple_potion, rune_stone
- 高级宝物/圣物：crown, ring, cthulhu_idol, dragon_fang, dragon_shield, flame_sword, genie_lamp, holy_branch, infinity_gauntlet, jeweled_crown, legendary_chest, lightning_orb, phoenix_feather, skull_dagger, spellbook, star_crystal, winged_hourglass

---

## 📝 物品定义示例

在 `constants.ts` 的 `ALL_ITEMS` 中：

```typescript
export const ALL_ITEMS = {
  POTION: {
    id: 'item_potion',
    name: '治愈药水',
    description: '恢复50点生命值。尝起来像樱桃味。',
    type: 'Consumable' as const,
    rarity: 'Common' as const,
    icon: IMAGES.icons.potion
  },
  // ... 其他物品
} as const;
```

### 物品类型 (type)
- `Consumable` - 消耗品（药水、食物）
- `Equipment` - 装备（武器、防具）
- `Material` - 素材（炼金材料、任务道具）
- `Key` - 关键物品（地图、徽章、房契）

### 稀有度 (rarity)
- `Common` - 普通（白色）
- `Rare` - 稀有（蓝色）
- `Epic` - 史诗（紫色，未使用）
- `Legendary` - 传奇（金色）

---

## 🎮 使用方法

### 1. 添加物品到背包

**正确做法：**
```typescript
import { getItemInstance } from '../constants';
import { useGame } from '../src/contexts/GameContext';

const { addItem } = useGame();

// 使用 getItemInstance 获取物品副本（带唯一ID）
const newPotion = getItemInstance('POTION');
addItem(newPotion);
```

**错误做法：**
```typescript
// ❌ 不要这样做！不要直接创建物品对象！
addItem({
  id: 'xxx',
  name: '新药水',
  // ... 这会导致没有对应图标资源
});
```

### 2. 获取职业初始物品

```typescript
import { getStartingInventory } from '../constants';

const inventory = getStartingInventory(ClassType.ALCHEMIST);
// 返回: [POTION, BREAD, BOOK] 的物品实例
```

### 3. 移除物品

```typescript
const { removeItem } = useGame();

removeItem(itemId); // 使用物品的唯一ID
```

---

## 🔧 扩展物品库

如果需要添加新物品：

1. **确保有对应的图标资源**（在R2存储桶中）
2. 在 `ALL_ITEMS` 中添加定义
3. 使用已有的16个图标之一
4. 不允许跑新图，必须复用现有图标（见上面的 64 张）

示例：
```typescript
export const ALL_ITEMS = {
  // ... 现有物品

  // 新增物品（复用已有图标）
  HOLY_WATER: {
    id: 'item_holy_water',
    name: '圣水',
    description: '驱散亡灵的圣水。',
    type: 'Consumable' as const,
    rarity: 'Rare' as const,
    icon: IMAGES.icons.potion  // 复用 potion 图标
  },

  DRAGON_SCALE: {
    id: 'item_dragon_scale',
    name: '龙鳞',
    description: '坚硬的龙鳞，炼金顶级素材。',
    type: 'Material' as const,
    rarity: 'Legendary' as const,
    icon: IMAGES.icons.diamond  // 复用 diamond 图标
  },
} as const;
```

---

## 🏷️ 当前物品清单

### Consumables（消耗品）
- `POTION` - 治愈药水（potion图标）
- `BREAD` - 旅行干粮（treasure图标）

### Equipment（装备）
- `SWORD` - 制式长剑（sword图标）
- `SHIELD` - 圆盾（shield图标）
- `WAND` - 木杖（wand图标）

### Materials（素材）
- `GOLD_COIN` - 金币×10（gold图标）
- `SLIME_JELLY` - 史莱姆果冻（goblin图标）
- `CRYSTAL` - 魔力结晶（diamond图标）
- `GOBLIN_EAR` - 哥布林耳朵（goblin图标）
- `CURSED_SKULL` - 诅咒头骨（skull图标）
- `FIRE_ESSENCE` - 火焰精华（fire图标）

### Key Items（关键物品）
- `BOOK` - 笔记本（book图标）
- `MAP` - 旧地图（book图标）
- `PHOENIX_FEATHER` - 凤凰羽毛（wings图标）
- `TREASURE_CHEST` - 宝箱（trunk图标）
- `KNIGHT_BADGE` - 骑士徽章（knight图标）
- `HOUSE_DEED` - 房契（house图标）

---

## 🎯 职业初始物品

- **炼金术士**: 治愈药水、旅行干粮、笔记本
- **王国骑士**: 制式长剑、圆盾、旅行干粮
- **碧空海盗**: 制式长剑、金币×10、旅行干粮
- **遗迹学者**: 木杖、笔记本、旅行干粮

---

## ⚠️ 注意事项

1. **不要直接修改 `ALL_ITEMS` 的物品对象**，它们是常量
2. **添加物品到背包时必须使用 `getItemInstance()`**，生成带唯一ID的副本
3. **所有新物品必须在 `ALL_ITEMS` 中预定义**
4. **只能使用已有的16个图标**，不允许添加新图标
5. 物品ID格式：`item_xxx` + 时间戳 + 随机字符串
