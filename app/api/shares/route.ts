import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase-server';

// GET /api/shares?todoId=xxx  — list who the owner has shared this todo with
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const todoId = searchParams.get('todoId');
  if (!todoId) return NextResponse.json({ error: 'todoId required' }, { status: 400 });

  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: shares, error } = await supabase
    .from('task_shares')
    .select('id, shared_with')
    .eq('todo_id', todoId)
    .eq('owner_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!shares || shares.length === 0) return NextResponse.json([]);

  const { data: users } = await supabase
    .from('user_lookup')
    .select('id, email')
    .in('id', shares.map((s) => s.shared_with));

  const emailMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.email]));

  return NextResponse.json(
    shares.map((s) => ({ id: s.id, email: emailMap[s.shared_with] ?? s.shared_with }))
  );
}

// POST /api/shares  — share a todo with another user by email
export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { todoId, email } = await request.json();
  if (!todoId || !email) return NextResponse.json({ error: 'todoId and email required' }, { status: 400 });

  const { data: target, error: lookupErr } = await supabase
    .from('user_lookup')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (lookupErr || !target) return NextResponse.json({ error: 'No account found with that email' }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: 'You cannot share with yourself' }, { status: 400 });

  const { data, error } = await supabase
    .from('task_shares')
    .insert({ todo_id: todoId, owner_id: user.id, shared_with: target.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already shared with this person' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, email: email.toLowerCase().trim() }, { status: 201 });
}
