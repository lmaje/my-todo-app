'use client';

import { getLevelProgress } from '@/lib/badges';
import type { UserStats } from '@/lib/types';

interface Props { stats: UserStats; }

export default function StatsBar({ stats }: Props) {
  const { level, current, needed, pct } = getLevelProgress(stats.xp);

  return (
    <div className="flex items-center gap-2.5">
      {/* Streak */}
      {stats.streak > 0 && (
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(217,79,56,0.1)',
            color: 'var(--priority-high)',
            border: '1px solid rgba(217,79,56,0.15)',
          }}
        >
          <span>🔥</span>
          <span>{stats.streak}</span>
        </div>
      )}

      {/* Level + bar */}
      <div
        className="flex items-center gap-2 px-2.5 py-1 rounded-full"
        style={{
          background: 'var(--accent-subtle)',
          border: '1px solid rgba(194,98,42,0.15)',
        }}
        title={`${stats.xp} XP · ${current}/${needed} to Level ${level + 1}`}
      >
        <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
          Lv {level}
        </span>
        <div
          className="hidden sm:block w-16 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(194,98,42,0.18)' }}
        >
          <div
            className="h-full rounded-full animate-xp-fill"
            style={{ width: `${pct}%`, background: 'var(--accent)' }}
          />
        </div>
        <span className="hidden sm:block text-[10px] font-medium" style={{ color: 'var(--accent)' }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
