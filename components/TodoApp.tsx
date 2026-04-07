'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import type { Todo, FilterStatus, Priority, Recurrence, Subtask, UserStats, CompleteReward, SharedTodoView } from '@/lib/types';
import AddTodoForm from './AddTodoForm';
import FilterBar from './FilterBar';
import TodoList from './TodoList';
import TodoItem from './TodoItem';
import SearchBar from './SearchBar';
import PomodoroTimer from './PomodoroTimer';
import DarkModeToggle from './DarkModeToggle';
import StatsBar from './StatsBar';
import BadgeToast from './BadgeToast';
import { createBrowserClient } from '@/lib/supabase';

interface Props {
  initialTodos: Todo[];
  initialStats: UserStats;
  userEmail?: string;
}

interface Toast {
  xpGained: number;
  newBadges: CompleteReward['newBadges'];
}

const DEFAULT_STATS: UserStats = {
  user_id: '', xp: 0, streak: 0,
  last_completed_date: null, total_completed: 0, badges: [],
};

function getNextDeadline(todo: Todo): string {
  const base = todo.deadline ?? new Date().toISOString().split('T')[0];
  const d = new Date(base + 'T00:00:00');
  if (todo.recurrence === 'daily')   d.setDate(d.getDate() + 1);
  if (todo.recurrence === 'weekly')  d.setDate(d.getDate() + 7);
  if (todo.recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

export default function TodoApp({ initialTodos, initialStats, userEmail }: Props) {
  const [todos,        setTodos]        = useState<Todo[]>(initialTodos);
  const [sharedTodos,  setSharedTodos]  = useState<SharedTodoView[]>([]);
  const [subtaskMap,   setSubtaskMap]   = useState<Record<string, Subtask[]>>({});
  const [filter,       setFilter]       = useState<FilterStatus>('all');
  const [stats,        setStats]        = useState<UserStats>(initialStats ?? DEFAULT_STATS);
  const [toast,        setToast]        = useState<Toast | null>(null);
  const [search,       setSearch]       = useState('');
  const [focusedTodo,  setFocusedTodo]  = useState<Todo | null>(null);
  const router = useRouter();

  // Fetch shared todos on mount
  useEffect(() => {
    fetch('/api/todos/shared')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSharedTodos(Array.isArray(data) ? data : []));
  }, []);

  const today = new Date().toISOString().split('T')[0];

  // Filter by tab + search query
  const filteredTodos = todos.filter((t) => {
    const matchesFilter =
      filter === 'active'    ? !t.completed :
      filter === 'completed' ? t.completed :
      filter === 'today'     ? !t.completed && t.deadline !== null && t.deadline <= today :
      true;
    const matchesSearch = !search || t.text.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all:       todos.length,
    active:    todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
    today:     todos.filter((t) => !t.completed && t.deadline !== null && t.deadline <= today).length,
  };

  // ── Sign out ──
  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── CRUD ──
  const addTodo = useCallback(async (text: string, deadline: string | null, priority: Priority, recurrence: Recurrence) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, deadline, priority, recurrence }),
    });
    if (!res.ok) return;
    const newTodo: Todo = await res.json();
    setTodos((prev) => [newTodo, ...prev]);
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await fetch('/api/todos').then((r) => r.json());
      setTodos(data);
    }
  }, []);

  const toggleTodo = useCallback(async (id: string, completed: boolean) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
      return;
    }

    if (completed) {
      const todo = todos.find((t) => t.id === id);
      if (todo) {
        // Award XP
        const rewardRes = await fetch('/api/stats/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority: todo.priority }),
        });
        if (rewardRes.ok) {
          const reward: CompleteReward = await rewardRes.json();
          setStats((prev) => ({
            ...prev,
            xp: reward.newXp,
            streak: reward.streak,
            total_completed: prev.total_completed + 1,
            badges: [...prev.badges, ...reward.newBadges.map((b) => b.id)],
          }));
          setToast({ xpGained: reward.xpGained, newBadges: reward.newBadges });
        }

        // Create next occurrence for recurring tasks
        if (todo.recurrence && todo.recurrence !== 'none') {
          const nextDeadline = getNextDeadline(todo);
          const nextRes = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: todo.text,
              deadline: nextDeadline,
              priority: todo.priority,
              recurrence: todo.recurrence,
              recurrence_days: todo.recurrence_days,
            }),
          });
          if (nextRes.ok) {
            const nextTodo: Todo = await nextRes.json();
            setTodos((prev) => [nextTodo, ...prev]);
          }
        }
      }
    }
  }, [todos]);

  const editTodo = useCallback(async (id: string, text: string) => {
    const prev = todos.find((t) => t.id === id)?.text;
    setTodos((prevTodos) => prevTodos.map((t) => (t.id === id ? { ...t, text } : t)));
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok && prev !== undefined) {
      setTodos((prevTodos) => prevTodos.map((t) => (t.id === id ? { ...t, text: prev } : t)));
    }
  }, [todos]);

  const updateDeadline = useCallback(async (id: string, deadline: string | null) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, deadline } : t)));
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deadline }),
    });
  }, []);

  const updatePriority = useCallback(async (id: string, priority: Priority) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
  }, []);

  const updateNotes = useCallback(async (id: string, notes: string | null) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)));
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
  }, []);

  const updateSubtasks = useCallback((todoId: string, subtasks: Subtask[]) => {
    setSubtaskMap((prev) => ({ ...prev, [todoId]: subtasks }));
  }, []);

  const handleReorder = useCallback((activeId: string, overId: string) => {
    setTodos((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === activeId);
      const newIndex = prev.findIndex((t) => t.id === overId);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      fetch('/api/todos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((t) => t.id) }),
      });
      return reordered;
    });
  }, []);

  // When pomodoro completes, mark the task done
  const handlePomodoroComplete = useCallback(async (todoId: string) => {
    await toggleTodo(todoId, true);
  }, [toggleTodo]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 6l3 3 7-7" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>Todos</span>
        </div>

        <div className="flex-1 flex justify-center">
          <StatsBar stats={stats} />
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Analytics link */}
          <button
            onClick={() => router.push('/analytics')}
            className="text-xs px-2.5 py-1.5 rounded-full transition-all hidden sm:flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            title="Analytics"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 10l3-4 2.5 2 2.5-5L12 10" />
            </svg>
            Stats
          </button>
          <DarkModeToggle />
          {userEmail && (
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{userEmail}</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-xl mx-auto px-4 pt-10 pb-20">
        <div className="mb-6 animate-fade-up afd-1">
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            My Tasks
          </h1>
        </div>

        <div className="animate-fade-up afd-2">
          <AddTodoForm onAdd={addTodo} />
        </div>

        {/* Search */}
        <div className="animate-fade-up afd-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            resultCount={search ? filteredTodos.length : undefined}
          />
        </div>

        <div className="animate-fade-up afd-3">
          <FilterBar current={filter} onChange={setFilter} counts={counts} />
        </div>

        <div className="animate-fade-up afd-4">
          <TodoList
            todos={filteredTodos}
            subtaskMap={subtaskMap}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            onDeadlineChange={updateDeadline}
            onPriorityChange={updatePriority}
            onNotesChange={updateNotes}
            onSubtasksChange={updateSubtasks}
            onReorder={handleReorder}
            onFocus={setFocusedTodo}
          />
        </div>

        {/* Shared with me */}
        {sharedTodos.length > 0 && (
          <div className="mt-10 animate-fade-up afd-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Shared with me
            </p>
            <ul className="space-y-1.5">
              {sharedTodos.map((todo) => (
                <TodoItem
                  key={`shared-${todo.id}`}
                  todo={todo}
                  subtasks={subtaskMap[todo.id] ?? []}
                  onToggle={toggleTodo}
                  onDelete={async () => {}}
                  onEdit={async () => {}}
                  onDeadlineChange={async () => {}}
                  onPriorityChange={async () => {}}
                  onNotesChange={async () => {}}
                  onSubtasksChange={() => {}}
                  isShared
                  sharedByEmail={todo.shared_by_email}
                />
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Pomodoro timer */}
      {focusedTodo && (
        <PomodoroTimer
          todo={focusedTodo}
          onClose={() => setFocusedTodo(null)}
          onComplete={handlePomodoroComplete}
        />
      )}

      {/* Badge / XP toast */}
      {toast && (
        <BadgeToast
          xpGained={toast.xpGained}
          badges={toast.newBadges}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
