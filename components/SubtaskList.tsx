'use client';

import { useState, useRef } from 'react';
import type { Subtask } from '@/lib/types';

interface Props {
  todoId: string;
  subtasks: Subtask[];
  onSubtasksChange: (todoId: string, subtasks: Subtask[]) => void;
}

export default function SubtaskList({ todoId, subtasks, onSubtasksChange }: Props) {
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    const res = await fetch('/api/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo_id: todoId, text: newText.trim() }),
    });
    if (!res.ok) return;
    const created: Subtask = await res.json();
    onSubtasksChange(todoId, [...subtasks, created]);
    setNewText('');
  }

  async function handleToggle(subtask: Subtask) {
    const updated = { ...subtask, completed: !subtask.completed };
    onSubtasksChange(todoId, subtasks.map((s) => (s.id === subtask.id ? updated : s)));
    await fetch(`/api/subtasks/${subtask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: updated.completed }),
    });
  }

  async function handleDelete(id: string) {
    onSubtasksChange(todoId, subtasks.filter((s) => s.id !== id));
    await fetch(`/api/subtasks/${id}`, { method: 'DELETE' });
  }

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div
      className="px-3 pb-3 pl-10 pt-2 space-y-1"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {/* Progress */}
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${subtasks.length ? (completedCount / subtasks.length) * 100 : 0}%`,
                background: 'var(--priority-low)',
              }}
            />
          </div>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {completedCount}/{subtasks.length}
          </span>
        </div>
      )}

      {/* Subtask rows */}
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2 group/sub">
          <button
            onClick={() => handleToggle(subtask)}
            className="flex-shrink-0 rounded-sm border flex items-center justify-center transition-all"
            style={{
              width: '14px', height: '14px',
              background: subtask.completed ? 'var(--priority-low)' : 'transparent',
              borderColor: subtask.completed ? 'var(--priority-low)' : 'var(--border)',
            }}
          >
            {subtask.completed && (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 4l2 2 4-4" />
              </svg>
            )}
          </button>
          <span
            className="flex-1 text-xs"
            style={{
              color: subtask.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
              textDecoration: subtask.completed ? 'line-through' : 'none',
            }}
          >
            {subtask.text}
          </span>
          <button
            onClick={() => handleDelete(subtask.id)}
            className="opacity-0 group-hover/sub:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--priority-high)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M2 2l6 6M8 2l-6 6" />
            </svg>
          </button>
        </div>
      ))}

      {/* Add subtask */}
      {adding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-2 mt-1">
          <div className="w-3.5 h-3.5 flex-shrink-0 rounded-sm border" style={{ borderColor: 'var(--border)' }} />
          <input
            ref={inputRef}
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onBlur={() => { if (!newText.trim()) setAdding(false); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setAdding(false); setNewText(''); } }}
            placeholder="Add subtask..."
            className="flex-1 text-xs outline-none bg-transparent"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
          />
          <button
            type="submit"
            disabled={!newText.trim()}
            className="text-[10px] px-2 py-0.5 rounded-full disabled:opacity-40"
            style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
          >
            Add
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[11px] mt-1 transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M5 1v8M1 5h8" />
          </svg>
          Add subtask
        </button>
      )}
    </div>
  );
}
