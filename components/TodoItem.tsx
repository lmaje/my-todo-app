'use client';

import { useState, useRef, useEffect } from 'react';
import type { Todo } from '@/lib/types';

interface Props {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onDeadlineChange: (id: string, deadline: string | null) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit, onDeadlineChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = todo.deadline && !todo.completed && todo.deadline < today;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  async function handleSaveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditText(todo.text);
      setIsEditing(false);
      return;
    }
    if (trimmed !== todo.text) {
      await onEdit(todo.id, trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  }

  function formatDeadline(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <li className="flex items-start gap-3 py-3 group">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? 'bg-zinc-900 border-zinc-900'
            : 'border-zinc-300 hover:border-zinc-500'
        }`}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm text-zinc-900 border-b border-zinc-300 focus:border-zinc-700 outline-none bg-transparent pb-0.5"
          />
        ) : (
          <span
            onClick={() => !todo.completed && setIsEditing(true)}
            className={`text-sm cursor-pointer leading-relaxed ${
              todo.completed
                ? 'line-through text-zinc-400'
                : 'text-zinc-900 hover:text-zinc-600'
            }`}
          >
            {todo.text}
          </span>
        )}

        {/* Deadline */}
        <div className="flex items-center gap-2 mt-1">
          <input
            type="date"
            value={todo.deadline ?? ''}
            onChange={(e) => onDeadlineChange(todo.id, e.target.value || null)}
            className={`text-xs border-none bg-transparent outline-none cursor-pointer ${
              isOverdue ? 'text-red-500' : 'text-zinc-400'
            }`}
          />
          {isOverdue && (
            <span className="text-xs text-red-500 font-medium">
              Overdue · {formatDeadline(todo.deadline!)}
            </span>
          )}
          {todo.deadline && !isOverdue && !todo.completed && (
            <span className="text-xs text-zinc-400">
              Due {formatDeadline(todo.deadline)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-400 mt-0.5"
        aria-label="Delete todo"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </li>
  );
}
