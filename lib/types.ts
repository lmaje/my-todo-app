export type Priority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  todo_id: string;
  text: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  xp: number;
  streak: number;
  last_completed_date: string | null;
  total_completed: number;
  badges: string[];
}

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface CompleteReward {
  xpGained: number;
  newXp: number;
  level: number;
  streak: number;
  newBadges: BadgeDefinition[];
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  deadline: string | null; // "YYYY-MM-DD"
  priority: Priority;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export type FilterStatus = 'all' | 'active' | 'completed' | 'today';

export interface SharedTodoView extends Todo {
  share_id: string;
  shared_by_email: string;
}

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
  notes?: string | null;
}
