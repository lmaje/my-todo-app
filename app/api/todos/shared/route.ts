import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase-server';

// GET /api/todos/shared  — todos that other users have shared with the current user
export async function GET() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: shares, error: sharesErr } = await supabase
    .from('task_shares')
    .select('id, owner_id, todo_id')
    .eq('shared_with', user.id);

  if (sharesErr) return NextResponse.json({ error: sharesErr.message }, { status: 500 });
  if (!shares || shares.length === 0) return NextResponse.json([]);

  const todoIds  = shares.map((s) => s.todo_id);
  const ownerIds = [...new Set(shares.map((s) => s.owner_id))];

  const [{ data: todos }, { data: owners }] = await Promise.all([
    supabase.from('todos').select('*').in('id', todoIds),
    supabase.from('user_lookup').select('id, email').in('id', ownerIds),
  ]);

  const emailMap   = Object.fromEntries((owners ?? []).map((u) => [u.id, u.email]));
  const shareByTodo = Object.fromEntries(shares.map((s) => [s.todo_id, s]));

  return NextResponse.json(
    (todos ?? []).map((t) => ({
      ...t,
      share_id:       shareByTodo[t.id]?.id ?? '',
      shared_by_email: emailMap[shareByTodo[t.id]?.owner_id] ?? '',
    }))
  );
}
