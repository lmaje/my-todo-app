export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  deadline: string | null; // "YYYY-MM-DD"
  created_at: string;
}

export type FilterStatus = 'all' | 'active' | 'completed';

export interface CreateTodoPayload {
  text: string;
  deadline?: string | null;
}

export interface UpdateTodoPayload {
  text?: string;
  completed?: boolean;
  deadline?: string | null;
}
