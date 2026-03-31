export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  deadline: string | null; // "YYYY-MM-DD"
  priority: Priority;
  sort_order: number;
  created_at: string;
}

export type FilterStatus = 'all' | 'active' | 'completed';

export interface CreateTodoPayload {
  text: string;
  deadline?: string | null;
  priority?: Priority;
}

export interface UpdateTodoPayload {
  text?: string;
  completed?: boolean;
  deadline?: string | null;
  priority?: Priority;
  sort_order?: number;
}
