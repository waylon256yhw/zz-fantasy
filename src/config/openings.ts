/**
 * Multi-Opening System Configuration
 *
 * Defines different starting scenarios for the game.
 * Players can choose or switch between different story routes.
 */

export interface Opening {
  id: string;
  name: string;
  description: string;
  location: string;
  icon?: string;
}

/**
 * Available opening scenarios
 */
export const OPENINGS: Opening[] = [
  {
    id: 'main',
    name: '主线：王都初至',
    description: '作为新晋冒险者，你第一次踏足繁华的王都阿斯拉。',
    location: '王都阿斯拉 - 中央广场',
    icon: '🏰',
  },
  {
    id: 'forest',
    name: '支线：迷雾森林',
    description: '在幽暗的森林中苏醒，记忆模糊，危机四伏。',
    location: '迷雾森林 - 深处',
    icon: '🌲',
  },
  {
    id: 'ruins',
    name: '探险：古代遗迹',
    description: '站在千年遗迹前，宝藏与真相在黑暗中等待。',
    location: '古代遗迹 - 入口',
    icon: '🏛️',
  },
];

/**
 * Get opening by ID
 */
export function getOpening(id: string): Opening | undefined {
  return OPENINGS.find((opening) => opening.id === id);
}

/**
 * Get default opening
 */
export function getDefaultOpening(): Opening {
  return OPENINGS[0];
}
