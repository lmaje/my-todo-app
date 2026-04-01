'use client';

import type { FilterStatus } from '@/lib/types';

interface Props {
  current: FilterStatus;
  onChange: (status: FilterStatus) => void;
  counts: { all: number; active: number; completed: number; today: number };
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Today',     value: 'today' },
  { label: 'Active',    value: 'active' },
  { label: 'Completed', value: 'completed' },
];

export default function FilterBar({ current, onChange, counts }: Props) {
  return (
    <div
      className="flex gap-0.5 mt-6 p-1 rounded-xl"
      style={{ background: 'var(--bg-subtle)' }}
    >
      {FILTERS.map(({ label, value }) => {
        const active = current === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: active ? 'var(--bg-card)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--shadow-card)' : 'none',
            }}
          >
            <span>{label}</span>
            {counts[value] > 0 && (
              <span
                className="text-[10px] px-1.5 rounded-full font-semibold"
                style={{
                  background: active ? 'var(--accent)' : 'var(--border)',
                  color: active ? 'white' : 'var(--text-muted)',
                }}
              >
                {counts[value]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
