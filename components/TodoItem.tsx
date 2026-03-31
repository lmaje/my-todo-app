'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Todo, Priority } from '@/lib/types';

interface Props {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onDeadlineChange: (id: string, deadline: string | null) => Promise<void>;
  onPriorityChange: (id: string, priority: Priority) => Promise<void>;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high:   'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low:    'var(--priority-low)',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'H', medium: 'M', low: 'L',
};

export default function TodoItem({ todo, onToggle, onDelete, onEdit, onDeadlineChange, onPriorityChange }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = todo.deadline && !todo.completed && todo.deadline < today;
  const priorityColor = PRIORITY_COLORS[todo.priority];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  async function handleSaveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) { setEditText(todo.text); setIsEditing(false); return; }
    if (trimmed !== todo.text) await onEdit(todo.id, trimmed);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') { setEditText(todo.text); setIsEditing(false); }
  }

  function formatDeadline(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-stretch rounded-lg overflow-hidden animate-slide-in"
      {...attributes}
    >
      {/* Priority stripe */}
      <div
        className="w-1 flex-shrink-0 transition-colors"
        style={{ background: todo.completed ? 'var(--border)' : priorityColor }}
      />

      <div
        className="flex-1 flex items-start gap-3 px-3 py-3 transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: 'none' }}
      >
        {/* Drag handle */}
        <button
          {...listeners}
          className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 hover:!opacity-70 cursor-grab active:cursor-grabbing transition-opacity"
          aria-label="Drag to reorder"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <circle cx="4" cy="3" r="1.5" /><circle cx="8" cy="3" r="1.5" />
            <circle cx="4" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
            <circle cx="4" cy="13" r="1.5" /><circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id, !todo.completed)}
          className="flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all"
          style={{
            width: '18px', height: '18px',
            background: todo.completed ? priorityColor : 'transparent',
            borderColor: todo.completed ? priorityColor : 'var(--border)',
          }}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {todo.completed && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
            </svg>
          )}
        </button>

        {/* Text + meta */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="w-full text-sm outline-none bg-transparent border-b pb-0.5"
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--accent)',
                caretColor: 'var(--accent)',
              }}
            />
          ) : (
            <span
              onClick={() => !todo.completed && setIsEditing(true)}
              className="text-sm leading-relaxed block"
              style={{
                color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: todo.completed ? 'line-through' : 'none',
                cursor: todo.completed ? 'default' : 'text',
              }}
            >
              {todo.text}
            </span>
          )}

          {/* Deadline + priority badge row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Priority circle */}
            <div className="relative">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                title={todo.priority}
                className="flex items-center justify-center rounded-full text-[11px] font-bold transition-all hover:opacity-80"
                style={{
                  width: '22px',
                  height: '22px',
                  background: `${priorityColor}25`,
                  color: priorityColor,
                  border: `1.5px solid ${priorityColor}`,
                }}
              >
                {PRIORITY_LABELS[todo.priority]}
              </button>
              {showPriorityMenu && (
                <div
                  className="absolute left-0 top-6 z-10 rounded-lg overflow-hidden shadow-lg flex gap-0"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => { onPriorityChange(todo.id, p); setShowPriorityMenu(false); }}
                      className="px-2.5 py-1.5 text-xs font-medium capitalize hover:opacity-80 transition-opacity"
                      style={{ color: PRIORITY_COLORS[p] }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Deadline */}
            <input
              type="date"
              value={todo.deadline ?? ''}
              onChange={(e) => onDeadlineChange(todo.id, e.target.value || null)}
              className="text-[11px] outline-none bg-transparent cursor-pointer"
              style={{ color: isOverdue ? 'var(--priority-high)' : 'var(--text-muted)' }}
            />
            {isOverdue && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: `${PRIORITY_COLORS.high}20`, color: PRIORITY_COLORS.high }}>
                Overdue · {formatDeadline(todo.deadline!)}
              </span>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(todo.id)}
          className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--priority-high)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>
    </li>
  );
}
