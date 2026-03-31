'use client';

import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import type { Todo, FilterStatus, Priority } from '@/lib/types';
import AddTodoForm from './AddTodoForm';
import FilterBar from './FilterBar';
import TodoList from './TodoList';
import DarkModeToggle from './DarkModeToggle';
import { createBrowserClient } from '@/lib/supabase';

interface Props {
  initialTodos: Todo[];
  userEmail?: string;
}

export default function TodoApp({ initialTodos, userEmail }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'today') return !t.completed && t.deadline !== null && t.deadline <= today;
    return true;
  });

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
    today: todos.filter((t) => !t.completed && t.deadline !== null && t.deadline <= today).length,
  };

  // ── Sign out ──
  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── CRUD ──
  const addTodo = useCallback(async (text: string, deadline: string | null, priority: Priority) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, deadline, priority }),
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
    }
  }, []);

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

  // ── Drag reorder (operates on the full todos array, not filtered) ──
  const handleReorder = useCallback((activeId: string, overId: string) => {
    setTodos((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === activeId);
      const newIndex = prev.findIndex((t) => t.id === overId);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Persist order
      fetch('/api/todos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((t) => t.id) }),
      });

      return reordered;
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-sm flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 6l3 3 7-7" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>
            Todos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <DarkModeToggle />
          {userEmail && (
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              {userEmail}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-xl mx-auto px-4 pt-10 pb-20">
        {/* Page title */}
        <h1
          className="text-4xl mb-8 animate-fade-up afd-1"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          My Tasks
        </h1>

        {/* Add form */}
        <div className="animate-fade-up afd-2">
          <AddTodoForm onAdd={addTodo} />
        </div>

        {/* Filter */}
        <div className="animate-fade-up afd-3">
          <FilterBar current={filter} onChange={setFilter} counts={counts} />
        </div>

        {/* List */}
        <div className="animate-fade-up afd-4">
          <TodoList
            todos={filteredTodos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            onDeadlineChange={updateDeadline}
            onPriorityChange={updatePriority}
            onNotesChange={updateNotes}
            onReorder={handleReorder}
          />
        </div>
      </main>
    </div>
  );
}
