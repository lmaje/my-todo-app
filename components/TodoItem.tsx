'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Todo, Priority, Subtask } from '@/lib/types';
import SubtaskList from './SubtaskList';

interface ShareRow { id: string; email: string; }

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
  // Shared-todo props (set when this item is from another user's list)
  isShared?: boolean;
  sharedByEmail?: string;
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

function googleCalUrl(todo: Todo) {
  const date = todo.deadline!.replace(/-/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(todo.text)}&dates=${date}/${date}${todo.notes ? `&details=${encodeURIComponent(todo.notes)}` : ''}`;
}

function downloadIcs(todo: Todo) {
  const date = todo.deadline!.replace(/-/g, '');
  const now  = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Focus Todo//EN',
    'BEGIN:VEVENT',
    `UID:${todo.id}@focustodo`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${date}`,
    `SUMMARY:${todo.text}`,
    todo.notes ? `DESCRIPTION:${todo.notes}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([lines], { type: 'text/calendar' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${todo.text.slice(0, 40).replace(/\s+/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TodoItem({
  todo, subtasks, onToggle, onDelete, onEdit,
  onDeadlineChange, onPriorityChange, onNotesChange, onSubtasksChange,
  isShared = false, sharedByEmail,
}: Props) {
  const [isEditing,        setIsEditing]        = useState(false);
  const [editText,         setEditText]          = useState(todo.text);
  const [showPriorityMenu, setShowPriorityMenu]  = useState(false);
  const [showNotes,        setShowNotes]         = useState(false);
  const [showSubtasks,     setShowSubtasks]      = useState(false);
  const [showShare,        setShowShare]         = useState(false);
  const [showCalendar,     setShowCalendar]      = useState(false);
  const [notesText,        setNotesText]         = useState(todo.notes ?? '');
  const [justChecked,      setJustChecked]       = useState(false);
  const [hovered,          setHovered]           = useState(false);

  // Share panel state
  const [shares,        setShares]        = useState<ShareRow[]>([]);
  const [shareEmail,    setShareEmail]    = useState('');
  const [shareError,    setShareError]    = useState('');
  const [isSharing,     setIsSharing]     = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const notesRef    = useRef<HTMLTextAreaElement>(null);
  const shareRef    = useRef<HTMLInputElement>(null);

  const today         = new Date().toISOString().split('T')[0];
  const isOverdue     = todo.deadline && !todo.completed && todo.deadline < today;
  const priorityColor = PRIORITY_COLORS[todo.priority];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id, disabled: isShared });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex:  isDragging ? 10 : undefined,
  };

  useEffect(() => { if (isEditing)  inputRef.current?.focus();  }, [isEditing]);
  useEffect(() => { if (showNotes)  notesRef.current?.focus();  }, [showNotes]);
  useEffect(() => { if (showShare)  shareRef.current?.focus();  }, [showShare]);

  // Load shares list when owner opens the share panel
  useEffect(() => {
    if (!showShare || isShared) return;
    setLoadingShares(true);
    fetch(`/api/shares?todoId=${todo.id}`)
      .then((r) => r.json())
      .then((data) => setShares(Array.isArray(data) ? data : []))
      .finally(() => setLoadingShares(false));
  }, [showShare, todo.id, isShared]);

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
    if (e.key === 'Enter')  handleSaveEdit();
    if (e.key === 'Escape') { setEditText(todo.text); setIsEditing(false); }
  }

  async function handleNotesSave() {
    const trimmed = notesText.trim() || null;
    if (trimmed !== (todo.notes ?? null)) await onNotesChange(todo.id, trimmed);
  }

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!shareEmail.trim() || isSharing) return;
    setIsSharing(true);
    setShareError('');
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId: todo.id, email: shareEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setShareError(data.error ?? 'Something went wrong'); return; }
      setShares((prev) => [...prev, { id: data.id, email: data.email }]);
      setShareEmail('');
    } finally {
      setIsSharing(false);
    }
  }

  async function handleRevoke(shareId: string) {
    await fetch(`/api/shares/${shareId}`, { method: 'DELETE' });
    setShares((prev) => prev.filter((s) => s.id !== shareId));
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
          background:  'var(--bg-card)',
          boxShadow:   hovered && !isDragging ? 'var(--shadow-lift)' : 'var(--shadow-card)',
          border:      `1.5px solid ${hovered && !isDragging ? 'var(--border-focus)' : 'var(--border)'}`,
          transform:   hovered && !isDragging ? 'translateY(-1px)' : 'translateY(0)',
          opacity:     todo.completed ? 0.65 : 1,
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

            {/* Drag handle — hidden for shared todos */}
            {!isShared && (
              <button
                {...listeners}
                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-30 hover:!opacity-60 cursor-grab active:cursor-grabbing transition-opacity pt-0.5"
                aria-label="Drag to reorder"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                  <circle cx="3" cy="2.5"  r="1.5" /><circle cx="7" cy="2.5"  r="1.5" />
                  <circle cx="3" cy="7"    r="1.5" /><circle cx="7" cy="7"    r="1.5" />
                  <circle cx="3" cy="11.5" r="1.5" /><circle cx="7" cy="11.5" r="1.5" />
                </svg>
              </button>
            )}

            {/* Checkbox */}
            <button
              onClick={handleToggle}
              className={`flex-shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${justChecked ? 'animate-check-pop' : ''}`}
              style={{
                width:       '20px', height: '20px',
                background:  todo.completed ? priorityColor : 'transparent',
                borderColor: todo.completed ? priorityColor : 'var(--border)',
                boxShadow:   todo.completed ? `0 0 0 3px ${priorityColor}22` : 'none',
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
                  onClick={() => !todo.completed && !isShared && setIsEditing(true)}
                  className="text-sm font-medium leading-relaxed block transition-all duration-200"
                  style={{
                    color:          todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    cursor:         todo.completed || isShared ? 'default' : 'text',
                  }}
                >
                  {todo.text}
                </span>
              )}

              {/* Shared-by badge */}
              {isShared && sharedByEmail && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="5" cy="4" r="2.5" />
                    <path strokeLinecap="round" d="M1 11c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                    <path strokeLinecap="round" d="M9 2l1.5 1.5L12 2" />
                    <path strokeLinecap="round" d="M10.5 3.5V6" />
                  </svg>
                  {sharedByEmail}
                </span>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">

                {/* Priority circle */}
                {!isShared && (
                  <div className="relative">
                    <button
                      onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                      title={todo.priority}
                      className="flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-150 hover:scale-110"
                      style={{
                        width: '20px', height: '20px',
                        background: `${priorityColor}20`,
                        color:      priorityColor,
                        border:     `1.5px solid ${priorityColor}60`,
                      }}
                    >
                      {PRIORITY_LABELS[todo.priority]}
                    </button>
                    {showPriorityMenu && (
                      <div
                        className="absolute left-0 top-7 z-20 rounded-xl overflow-hidden flex shadow-lg"
                        style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-lift)' }}
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
                )}

                {/* Deadline */}
                {!isShared ? (
                  <input
                    type="date"
                    value={todo.deadline ?? ''}
                    onChange={(e) => onDeadlineChange(todo.id, e.target.value || null)}
                    className="text-[11px] outline-none bg-transparent cursor-pointer"
                    style={{ color: isOverdue ? 'var(--priority-high)' : 'var(--text-muted)' }}
                  />
                ) : todo.deadline ? (
                  <span className="text-[11px]" style={{ color: isOverdue ? 'var(--priority-high)' : 'var(--text-muted)' }}>
                    {formatDeadline(todo.deadline)}
                  </span>
                ) : null}

                {isOverdue && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${PRIORITY_COLORS.high}15`, color: PRIORITY_COLORS.high }}
                  >
                    Overdue · {formatDeadline(todo.deadline!)}
                  </span>
                )}

                {/* Calendar button — only when deadline is set */}
                {todo.deadline && (
                  <button
                    onClick={() => { setShowCalendar(!showCalendar); setShowShare(false); }}
                    className="flex items-center gap-1 text-[11px] transition-all hover:opacity-80"
                    style={{ color: showCalendar ? 'var(--accent)' : 'var(--text-muted)' }}
                    title="Add to calendar"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="1" y="2" width="10" height="9" rx="1.5" />
                      <path strokeLinecap="round" d="M4 1v2M8 1v2M1 5h10" />
                    </svg>
                  </button>
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
                    <span className="text-[10px]">{subtasks.filter((s) => s.completed).length}/{subtasks.length}</span>
                  )}
                </button>

                {/* Share button — own todos only */}
                {!isShared && (
                  <button
                    onClick={() => { setShowShare(!showShare); setShowCalendar(false); }}
                    className="flex items-center gap-1 text-[11px] transition-all hover:opacity-80"
                    style={{ color: showShare ? 'var(--accent)' : 'var(--text-muted)' }}
                    title="Share task"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="9.5" cy="2.5" r="1.5" />
                      <circle cx="9.5" cy="9.5" r="1.5" />
                      <circle cx="2.5" cy="6"   r="1.5" />
                      <path strokeLinecap="round" d="M4 6l4-3.5M4 6l4 3.5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Delete — own todos only */}
            {!isShared && (
              <button
                onClick={() => onDelete(todo.id)}
                className="flex-shrink-0 mt-1 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110"
                aria-label="Delete"
                style={{ color: 'var(--text-muted)', background: 'transparent' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color      = 'var(--priority-high)';
                  (e.currentTarget as HTMLButtonElement).style.background = `${PRIORITY_COLORS.high}12`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color      = 'var(--text-muted)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Calendar panel ── */}
          {showCalendar && todo.deadline && (
            <div
              className="px-4 pb-3.5 pl-12 flex items-center gap-2 flex-wrap"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-[11px] pt-2.5" style={{ color: 'var(--text-muted)' }}>Add to calendar:</span>
              <a
                href={googleCalUrl(todo)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full transition-all hover:opacity-80"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border-focus)' }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="1" y="2" width="10" height="9" rx="1.5" />
                  <path strokeLinecap="round" d="M4 1v2M8 1v2M1 5h10" />
                </svg>
                Google Calendar
              </a>
              <button
                onClick={() => downloadIcs(todo)}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full transition-all hover:opacity-80"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" d="M6 1v7M3.5 5.5L6 8l2.5-2.5" />
                  <path strokeLinecap="round" d="M2 10h8" />
                </svg>
                Apple / Outlook
              </button>
            </div>
          )}

          {/* ── Share panel ── */}
          {showShare && !isShared && (
            <div
              className="px-4 pb-3.5 pl-12"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <form onSubmit={handleShare} className="flex items-center gap-2 pt-2.5">
                <input
                  ref={shareRef}
                  type="email"
                  value={shareEmail}
                  onChange={(e) => { setShareEmail(e.target.value); setShareError(''); }}
                  placeholder="colleague@email.com"
                  className="flex-1 text-xs outline-none bg-transparent rounded-lg px-2.5 py-1.5"
                  style={{
                    color:  'var(--text-primary)',
                    border: '1px solid var(--border-focus)',
                    caretColor: 'var(--accent)',
                  }}
                />
                <button
                  type="submit"
                  disabled={!shareEmail.trim() || isSharing}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  {isSharing ? '…' : 'Share'}
                </button>
              </form>

              {shareError && (
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--priority-high)' }}>{shareError}</p>
              )}

              {/* Current shares list */}
              {loadingShares ? (
                <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : shares.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {shares.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {s.email}
                      </span>
                      <button
                        onClick={() => handleRevoke(s.id)}
                        className="text-[10px] font-semibold transition-all hover:opacity-70"
                        style={{ color: 'var(--priority-high)' }}
                        title="Revoke access"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes panel */}
          {showNotes && (
            <div className="px-4 pb-3.5 pl-12" style={{ borderTop: '1px solid var(--border)' }}>
              <textarea
                ref={notesRef}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                onBlur={handleNotesSave}
                readOnly={isShared}
                placeholder={isShared ? 'No notes' : 'Add a note…'}
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
