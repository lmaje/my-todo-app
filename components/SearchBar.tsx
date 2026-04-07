'use client';

import { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  resultCount?: number;
}

export default function SearchBar({ value, onChange, resultCount }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === ref.current) {
        onChange('');
        ref.current?.blur();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChange]);

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 mt-5"
      style={{
        background: 'var(--bg-card)',
        border: `1.5px solid ${value ? 'var(--border-focus)' : 'var(--border)'}`,
        boxShadow: value ? 'var(--shadow-lift)' : 'var(--shadow-card)',
      }}
    >
      {/* Search icon */}
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
        <circle cx="6" cy="6" r="4.5" />
        <path strokeLinecap="round" d="M9.5 9.5l3 3" />
      </svg>

      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tasks…"
        className="flex-1 text-sm outline-none bg-transparent"
        style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
      />

      {/* Result count */}
      {value && (
        <span className="text-[11px] font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {resultCount === 0 ? 'No results' : `${resultCount} found`}
        </span>
      )}

      {/* Clear */}
      {value ? (
        <button
          onClick={() => { onChange(''); ref.current?.focus(); }}
          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: 'var(--text-muted)', color: 'var(--bg)' }}
        >
          <svg width="7" height="7" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M1 1l6 6M7 1L1 7" />
          </svg>
        </button>
      ) : (
        <kbd
          className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontFamily: 'monospace' }}
        >
          ⌘K
        </kbd>
      )}
    </div>
  );
}
