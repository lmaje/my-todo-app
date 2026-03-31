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
    <div className="flex gap-1 mt-5">
      {FILTERS.map(({ label, value }) => {
        const active = current === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: active ? 'var(--pill-active-bg)' : 'transparent',
              color: active ? 'var(--pill-active-text)' : 'var(--text-muted)',
              border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
            }}
          >
            {label}
            <span
              className="text-[10px] px-1 rounded-full"
              style={{
                background: active ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                color: active ? 'var(--pill-active-text)' : 'var(--text-muted)',
              }}
            >
              {counts[value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
