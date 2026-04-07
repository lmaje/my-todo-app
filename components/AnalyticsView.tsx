'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLevel, getLevelProgress } from '@/lib/badges';
import type { UserStats } from '@/lib/types';

interface LogEntry { completed_at: string; priority: string; }
interface AnalyticsData { stats: UserStats | null; logs: LogEntry[]; }

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });
}

function dayLabel(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

export default function AnalyticsView() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    );
  }

  const stats = data?.stats;
  const logs  = data?.logs ?? [];
  const days  = getLast7Days();

  // Count completions per day
  const countByDay: Record<string, number> = {};
  days.forEach((d) => (countByDay[d] = 0));
  logs.forEach((l) => { if (countByDay[l.completed_at] !== undefined) countByDay[l.completed_at]++; });

  const maxCount = Math.max(...Object.values(countByDay), 1);

  // Priority breakdown
  const byPriority = { high: 0, medium: 0, low: 0 };
  logs.forEach((l) => {
    if (l.priority === 'high' || l.priority === 'medium' || l.priority === 'low') byPriority[l.priority]++;
  });
  const totalLogs = logs.length || 1;

  const xp              = stats?.xp ?? 0;
  const level           = getLevel(xp);
  const { pct, current, needed } = getLevelProgress(xp);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center gap-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 1L3 6l5 5" />
          </svg>
          Back
        </button>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Analytics</h2>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-8 pb-20 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Tasks completed', value: stats?.total_completed ?? 0, sub: 'all time' },
            { label: 'Current streak',  value: `${stats?.streak ?? 0}d`,    sub: 'days in a row' },
            { label: 'Level',           value: level,                        sub: `${xp} XP total` },
            { label: 'Badges earned',   value: (stats?.badges ?? []).length, sub: 'of 9' },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="rounded-2xl p-4"
              style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-2xl font-bold leading-none mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {value}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* XP progress bar */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Level {level} → {level + 1}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{current} / {needed} XP</p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
            <div
              className="h-full rounded-full animate-xp-fill"
              style={{ width: `${pct}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* 7-day chart */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Last 7 days</p>
          <div className="flex items-end gap-2 h-24">
            {days.map((day) => {
              const count   = countByDay[day];
              const height  = count === 0 ? 4 : Math.max(12, (count / maxCount) * 96);
              const isToday = day === new Date().toISOString().split('T')[0];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold" style={{ color: count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {count > 0 ? count : ''}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${height}px`,
                      background: count === 0 ? 'var(--border)' : isToday ? 'var(--accent)' : `var(--accent)`,
                      opacity: count === 0 ? 1 : isToday ? 1 : 0.6,
                    }}
                  />
                  <span className="text-[10px]" style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>
                    {dayLabel(day)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority breakdown */}
        {logs.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>This week by priority</p>
            <div className="space-y-2.5">
              {([['high', 'var(--priority-high)'], ['medium', 'var(--priority-medium)'], ['low', 'var(--priority-low)']] as const).map(([p, color]) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold w-14 capitalize" style={{ color }}>{p}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(byPriority[p] / totalLogs) * 100}%`, background: color, transition: 'width 0.6s ease' }}
                    />
                  </div>
                  <span className="text-[11px] w-4 text-right" style={{ color: 'var(--text-muted)' }}>{byPriority[p]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
