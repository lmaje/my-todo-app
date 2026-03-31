'use client';

import { useState } from 'react';
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd(text.trim(), deadline || null, priority);
      setText('');
      setDeadline('');
      setPriority('medium');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

      {/* Text input */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        disabled={isSubmitting}
        className="w-full text-sm outline-none bg-transparent"
        style={{
          color: 'var(--text-primary)',
          caretColor: 'var(--accent)',
        }}
        // Using a simple placeholder style approach
      />

      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority circles */}
        <div className="flex gap-2 items-center">
          {PRIORITIES.map((p) => {
            const selected = priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                title={p.label}
                className="flex items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  width: '26px',
                  height: '26px',
                  background: selected ? p.color : `${p.color}22`,
                  color: selected ? 'white' : p.color,
                  outline: selected ? `2px solid ${p.color}` : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              >
                {p.letter}
              </button>
            );
          })}
        </div>

        {/* Date */}
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={isSubmitting}
          className="text-xs outline-none bg-transparent rounded-full px-2.5 py-1 transition-all"
          style={{
            color: deadline ? 'var(--text-secondary)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
          title="Set deadline"
        />

        {/* Spacer + submit */}
        <div className="ml-auto">
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
          >
            {isSubmitting ? '…' : 'Add'}
          </button>
        </div>
      </div>
    </form>
  );
}
