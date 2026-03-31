import { createAuthServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import TodoApp from '@/components/TodoApp';
import type { Todo, UserStats } from '@/lib/types';

export default async function Home() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: todos }, { data: stats }] = await Promise.all([
    supabase.from('todos').select('*').order('sort_order', { ascending: true }),
    supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
  ]);

  const defaultStats: UserStats = {
    user_id: user.id, xp: 0, streak: 0,
    last_completed_date: null, total_completed: 0, badges: [],
  };

  return (
    <TodoApp
      initialTodos={(todos as Todo[]) ?? []}
      initialStats={(stats as UserStats) ?? defaultStats}
      userEmail={user.email}
    />
  );
}
