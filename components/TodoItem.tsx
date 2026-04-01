'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Todo, Priority, Subtask } from '@/lib/types';
import SubtaskList from './SubtaskList';

interface Props {
  todo: Todo;
  subtasks: Subtask[];
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onDeadlineChange: (id: string, deadline: string | null) => Promise<void>;
  onPriorityChange: (id: string, priority: Priority) => Promise<void>;
  onNotesChange: (id: string, notes: string | null) => Promise<void>;
  onSubtasksChange: (todoId: string, subtasks: Subtask[]) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high:   'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low:    'var(--priority-low)',
};
const PRIORITY_LABELS: Record<Priority, string> = { high: 'H', medium: 'M', low: 'L' };

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 55,
    spread: 50,
    origin: { y: 0.65 },
    colors: ['#e09050', '#4abf7a', '#ede8e0', '#c2622a'],
    scalar: 0.85,
    ticks: 90,
  });
}

export default function TodoItem({
  todo, subtasks, onToggle, onDelete, onEdit,
  onDeadlineChange, onPriorityChange, onNotesChange, onSubtasksChange,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [notesText, setNotesText] = useState(todo.notes ?? '');
  const [justChecked, setJustChecked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = todo.deadline && !todo.completed && todo.deadline < today;
  const priorityColor = PRIORITY_COLORS[todo.priority];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);
  useEffect(() => { if (showNotes) notesRef.current?.focus(); }, [showNotes]);

  async function handleToggle() {
    const newCompleted = !todo.completed;
    if (newCompleted) {
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 400);
      fireConfetti();
    }
    await onToggle(todo.id, newCompleted);
  }

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

  async function handleNotesSave() {
    const trimmed = notesText.trim() || null;
    if (trimmed !== (todo.notes ?? null)) await onNotesChange(todo.id, trimmed);
  }

  function formatDeadline(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group animate-slide-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...attributes}
    >
      <div
        className="flex items-stretch rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: 'var(--bg-card)',
          boxShadow: hovered && !isDragging ? 'var(--shadow-lift)' : 'var(--shadow-card)',
          border: `1.5px solid ${hovered && !isDragging ? 'var(--border-focus)' : 'var(--border)'}`,
          transform: hovered && !isDragging ? 'translateY(-1px)' : 'translateY(0)',
          opacity: todo.completed ? 0.65 : 1,
        }}
      >
        {/* Priority stripe */}
        <div
          className="w-1 flex-shrink-0 rounded-l-2xl transition-all duration-300"
          style={{ background: todo.completed ? 'var(--border)' : priorityColor }}
        />

        <div className="flex-1 flex flex-col">
          {/* Main row */}
          <div className="flex items-start gap-3 px-4 py-3.5">
            {/* Drag handle */}
            <button
              {...listeners}
              className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-30 hover:!opacity-60 cursor-grab active:cursor-grabbing transition-opacity pt-0.5"
              aria-label="Drag to reorder"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                <circle cx="3" cy="2.5" r="1.5" /><circle cx="7" cy="2.5" r="1.5" />
                <circle cx="3" cy="7" r="1.5" /><circle cx="7" cy="7" r="1.5" />
                <circle cx="3" cy="11.5" r="1.5" /><circle cx="7" cy="11.5" r="1.5" />
              </svg>
            </button>

            {/* Checkbox — spring pop on check */}
            <button
              onClick={handleToggle}
              className={`flex-shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${justChecked ? 'animate-check-pop' : ''}`}
              style={{
                width: '20px', height: '20px',
                background: todo.completed ? priorityColor : 'transparent',
                borderColor: todo.completed ? priorityColor : 'var(--border)',
                boxShadow: todo.completed ? `0 0 0 3px ${priorityColor}22` : 'none',
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
                  className="w-full text-sm outline-none bg-transparent border-b-2 pb-0.5 font-medium"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--accent)', caretColor: 'var(--accent)' }}
                />
              ) : (
                <span
                  onClick={() => !todo.completed && setIsEditing(true)}
                  className="text-sm font-medium leading-relaxed block transition-all duration-200"
                  style={{
                    color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    cursor: todo.completed ? 'default' : 'text',
                  }}
                >
                  {todo.text}
                </span>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                {/* Priority circle */}
                <div className="relative">
                  <button
                    onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                    title={todo.priority}
                    className="flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-150 hover:scale-110"
                    style={{
                      width: '20px', height: '20px',
                      background: `${priorityColor}20`,
                      color: priorityColor,
                      border: `1.5px solid ${priorityColor}60`,
                    }}
                  >
                    {PRIORITY_LABELS[todo.priority]}
                  </button>
                  {showPriorityMenu && (
                    <div
                      className="absolute left-0 top-7 z-20 rounded-xl overflow-hidden flex shadow-lg"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        boxShadow: 'var(--shadow-lift)',
                      }}
                    >
                      {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => { onPriorityChange(todo.id, p); setShowPriorityMenu(false); }}
                          className="px-3 py-2 text-xs font-semibold capitalize transition-all hover:opacity-70"
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
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${PRIORITY_COLORS.high}15`, color: PRIORITY_COLORS.high }}
                  >
                    Overdue · {formatDeadline(todo.deadline!)}
                  </span>
                )}

                {/* Notes toggle */}
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-1 text-[11px] transition-all hover:opacity-80"
                  style={{ color: todo.notes ? 'var(--accent)' : 'var(--text-muted)' }}
                  title={showNotes ? 'Hide notes' : 'Add notes'}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M2 3h8M2 6h6M2 9h4" />
                  </svg>
                  {todo.notes && !showNotes && <span className="text-[10px]">note</span>}
                </button>

                {/* Subtasks toggle */}
                <button
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="flex items-center gap-1 text-[11px] transition-all hover:opacity-80"
                  style={{ color: subtasks.length > 0 ? 'var(--accent)' : 'var(--text-muted)' }}
                  title="Subtasks"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M4 3h6M4 6h6M4 9h6M1.5 3h.01M1.5 6h.01M1.5 9h.01" />
                  </svg>
                  {subtasks.length > 0 && (
                    <span className="text-[10px]">{subtasks.filter(s => s.completed).length}/{subtasks.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete(todo.id)}
              className="flex-shrink-0 mt-1 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110"
              aria-label="Delete"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--priority-high)';
                (e.currentTarget as HTMLButtonElement).style.background = `${PRIORITY_COLORS.high}12`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
              </svg>
            </button>
          </div>

          {/* Notes panel */}
          {showNotes && (
            <div
              className="px-4 pb-3.5 pl-12"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <textarea
                ref={notesRef}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                onBlur={handleNotesSave}
                placeholder="Add a note…"
                rows={2}
                className="w-full text-xs outline-none bg-transparent resize-none pt-2.5 leading-relaxed"
                style={{ color: 'var(--text-secondary)', caretColor: 'var(--accent)' }}
              />
            </div>
          )}

          {/* Subtasks panel */}
          {showSubtasks && (
            <SubtaskList
              todoId={todo.id}
              subtasks={subtasks}
              onSubtasksChange={onSubtasksChange}
            />
          )}
        </div>
      </div>
    </li>
  );
}
