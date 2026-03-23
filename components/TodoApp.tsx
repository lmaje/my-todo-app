'use client';

import { useState, useCallback } from 'react';
import type { Todo, FilterStatus } from '@/lib/types';
import AddTodoForm from './AddTodoForm';
import FilterBar from './FilterBar';
import TodoList from './TodoList';

interface Props {
  initialTodos: Todo[];
}

export default function TodoApp({ initialTodos }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  const addTodo = useCallback(async (text: string, deadline: string | null) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, deadline }),
    });
    if (!res.ok) return;
    const newTodo: Todo = await res.json();
    setTodos((prev) => [newTodo, ...prev]);
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    // Optimistic
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      // Revert — refetch
      const data = await fetch('/api/todos').then((r) => r.json());
      setTodos(data);
    }
  }, []);

  const toggleTodo = useCallback(async (id: string, completed: boolean) => {
    // Optimistic
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

  return (
    <main className="min-h-screen bg-white flex items-start justify-center pt-16 px-4 pb-16">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-semibold text-zinc-900 mb-8 tracking-tight">My Todos</h1>
        <AddTodoForm onAdd={addTodo} />
        <FilterBar current={filter} onChange={setFilter} counts={counts} />
        <TodoList
          todos={filteredTodos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
          onDeadlineChange={updateDeadline}
        />
      </div>
    </main>
  );
}
