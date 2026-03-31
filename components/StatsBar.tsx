'use client';

import { getLevelProgress } from '@/lib/badges';
import type { UserStats } from '@/lib/types';

interface Props {
  stats: UserStats;
}

export default function StatsBar({ stats }: Props) {
  const { level, current, needed, pct } = getLevelProgress(stats.xp);

  return (
    <div className="flex items-center gap-3">
      {/* Streak */}
      {stats.streak > 0 && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'var(--priority-high)20', color: 'var(--priority-high)' }}
          title={`${stats.streak}-day streak`}
        >
          <span>🔥</span>
          <span>{stats.streak}</span>
        </div>
      )}

      {/* Level + XP bar */}
      <div className="flex items-center gap-2" title={`${stats.xp} XP total · ${current}/${needed} to next level`}>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: 'var(--accent)', color: 'white', minWidth: '32px', textAlign: 'center' }}
        >
          Lv{level}
        </span>
        <div className="hidden sm:flex flex-col gap-0.5">
          <div
            className="w-20 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--border)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'var(--accent)' }}
            />
          </div>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {current}/{needed} XP
          </span>
        </div>
      </div>
    </div>
  );
}
