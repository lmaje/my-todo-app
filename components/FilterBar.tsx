'use client';

import type { FilterStatus } from '@/lib/types';

interface Props {
  current: FilterStatus;
  onChange: (status: FilterStatus) => void;
  counts: { all: number; active: number; completed: number };
}

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

export default function FilterBar({ current, onChange, counts }: Props) {
  return (
    <div className="flex gap-1 mt-6 border-b border-zinc-100">
      {FILTERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-2 text-sm font-medium transition-colors relative ${
            current === value
              ? 'text-zinc-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-900'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          {label}
          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
            current === value ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {counts[value]}
          </span>
        </button>
      ))}
    </div>
  );
}
