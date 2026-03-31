'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Todo, Priority } from '@/lib/types';
import TodoItem from './TodoItem';

interface Props {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onDeadlineChange: (id: string, deadline: string | null) => Promise<void>;
  onPriorityChange: (id: string, priority: Priority) => Promise<void>;
  onNotesChange: (id: string, notes: string | null) => Promise<void>;
  onReorder: (activeId: string, overId: string) => void;
}

export default function TodoList({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onDeadlineChange,
  onPriorityChange,
  onNotesChange,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  if (todos.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nothing here yet.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="mt-4 space-y-1.5">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onDeadlineChange={onDeadlineChange}
              onPriorityChange={onPriorityChange}
              onNotesChange={onNotesChange}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
