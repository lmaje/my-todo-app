'use client';

import type { Todo } from '@/lib/types';
import TodoItem from './TodoItem';

interface Props {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onDeadlineChange: (id: string, deadline: string | null) => Promise<void>;
}

export default function TodoList({ todos, onToggle, onDelete, onEdit, onDeadlineChange }: Props) {
  if (todos.length === 0) {
    return (
      <p className="text-zinc-400 text-sm mt-8 text-center">Nothing here yet.</p>
    );
  }

  return (
    <ul className="mt-2 divide-y divide-zinc-100">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onDeadlineChange={onDeadlineChange}
        />
      ))}
    </ul>
  );
}
