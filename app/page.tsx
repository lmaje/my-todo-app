import { createAuthServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import TodoApp from '@/components/TodoApp';
import type { Todo } from '@/lib/types';

export default async function Home() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabase
    .from('todos')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <TodoApp
      initialTodos={(data as Todo[]) ?? []}
      userEmail={user.email}
    />
  );
}
