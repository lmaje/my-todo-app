import type { BadgeDefinition, UserStats } from './types';
import type { Priority } from './types';

export const BADGES: BadgeDefinition[] = [
  { id: 'first_task',    icon: '🌱', label: 'First Steps',    description: 'Complete your first task' },
  { id: 'high_five',     icon: '✋', label: 'High Five',      description: 'Complete 5 tasks' },
  { id: 'ten_done',      icon: '🎯', label: 'Perfect Ten',    description: 'Complete 10 tasks' },
  { id: 'twenty_five',   icon: '🏆', label: 'Champion',       description: 'Complete 25 tasks' },
  { id: 'high_priority', icon: '🔴', label: 'Top Priority',   description: 'Complete a High priority task' },
  { id: 'streak_3',      icon: '🔥', label: 'On Fire',        description: '3-day streak' },
  { id: 'streak_7',      icon: '⚡', label: 'Lightning',      description: '7-day streak' },
  { id: 'level_3',       icon: '💪', label: 'Getting Strong', description: 'Reach Level 3' },
  { id: 'level_5',       icon: '💎', label: 'Diamond',        description: 'Reach Level 5' },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000];

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function getLevelProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = getLevel(xp);
  const thresholdIdx = level - 1;
  const current = xp - LEVEL_THRESHOLDS[thresholdIdx];
  const needed = (LEVEL_THRESHOLDS[thresholdIdx + 1] ?? LEVEL_THRESHOLDS[thresholdIdx] + 500) - LEVEL_THRESHOLDS[thresholdIdx];
  return { level, current, needed, pct: Math.round((current / needed) * 100) };
}

export const XP_PER_PRIORITY: Record<Priority, number> = {
  high: 30,
  medium: 20,
  low: 10,
};

export function checkNewBadges(
  prev: UserStats,
  next: { xp: number; streak: number; total_completed: number; priority: Priority }
): BadgeDefinition[] {
  const earned = new Set(prev.badges);
  const newBadges: BadgeDefinition[] = [];

  function check(id: string, condition: boolean) {
    if (condition && !earned.has(id)) {
      newBadges.push(BADGE_MAP[id]);
      earned.add(id);
    }
  }

  check('first_task',    next.total_completed >= 1);
  check('high_five',     next.total_completed >= 5);
  check('ten_done',      next.total_completed >= 10);
  check('twenty_five',   next.total_completed >= 25);
  check('high_priority', next.priority === 'high');
  check('streak_3',      next.streak >= 3);
  check('streak_7',      next.streak >= 7);
  check('level_3',       getLevel(next.xp) >= 3);
  check('level_5',       getLevel(next.xp) >= 5);

  return newBadges;
}
