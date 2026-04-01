'use client';

import { useState, useRef } from 'react';
import type { Priority } from '@/lib/types';

interface Props {
  onAdd: (text: string, deadline: string | null, priority: Priority) => Promise<void>;
}

const PRIORITIES: { value: Priority; letter: string; label: string; color: string }[] = [
  { value: 'high',   letter: 'H', label: 'High',   color: 'var(--priority-high)' },
  { value: 'medium', letter: 'M', label: 'Medium', color: 'var(--priority-medium)' },
  { value: 'low',    letter: 'L', label: 'Low',    color: 'var(--priority-low)' },
];

export default function AddTodoForm({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd(text.trim(), deadline || null, priority);
      setText('');
      setDeadline('');
      setPriority('medium');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        boxShadow: focused ? 'var(--shadow-lift)' : 'var(--shadow-card)',
        border: `1.5px solid ${focused ? 'var(--border-focus)' : 'var(--border)'}`,
      }}
    >
      {/* Text row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Placeholder circle */}
        <div
          className="flex-shrink-0 w-4 h-4 rounded-full border-2 transition-colors"
          style={{ borderColor: focused ? 'var(--accent)' : 'var(--border)' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="What's on your mind?"
          disabled={isSubmitting}
          className="flex-1 text-sm outline-none bg-transparent font-medium"
          style={{
            color: 'var(--text-primary)',
            caretColor: 'var(--accent)',
          }}
        />
      </div>

      {/* Options row — only visible when focused or has text */}
      <div
        className="flex items-center gap-2 px-4 pb-3 transition-all duration-200"
        style={{ opacity: focused || text ? 1 : 0.5 }}
      >
        {/* Priority circles */}
        <div className="flex items-center gap-1.5">
          {PRIORITIES.map((p) => {
            const selected = priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                title={p.label}
                className="flex items-center justify-center rounded-full text-[11px] font-bold transition-all duration-150"
                style={{
                  width: '24px', height: '24px',
                  background: selected ? p.color : `${p.color}18`,
                  color: selected ? 'white' : p.color,
                  transform: selected ? 'scale(1.12)' : 'scale(1)',
                  boxShadow: selected ? `0 2px 6px ${p.color}50` : 'none',
                }}
              >
                {p.letter}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

        {/* Date */}
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={isSubmitting}
          className="text-xs outline-none bg-transparent rounded-lg px-2 py-1 transition-colors"
          style={{
            color: deadline ? 'var(--text-secondary)' : 'var(--text-muted)',
            border: `1px solid ${deadline ? 'var(--border-focus)' : 'var(--border)'}`,
          }}
          title="Set deadline"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="ml-auto px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-30"
          style={{
            background: text.trim() ? 'var(--accent)' : 'var(--text-primary)',
            color: 'white',
            transform: text.trim() ? 'scale(1)' : 'scale(0.97)',
          }}
        >
          {isSubmitting ? '…' : 'Add task'}
        </button>
      </div>
    </form>
  );
}
