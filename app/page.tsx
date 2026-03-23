import { createServerClient } from '@/lib/supabase';
import TodoApp from '@/components/TodoApp';
import type { Todo } from '@/lib/types';

export default async function Home() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  return <TodoApp initialTodos={(data as Todo[]) ?? []} />;
}
