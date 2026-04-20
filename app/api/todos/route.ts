import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase-server';
import type { CreateTodoPayload } from '@/lib/types';

export async function GET() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: CreateTodoPayload = await request.json();
  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('todos')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .limit(1);

  const minOrder = existing?.[0]?.sort_order ?? 0;

  const { data, error } = await supabase
    .from('todos')
    .insert({
      user_id:         user.id,
      text:            body.text.trim(),
      completed:       false,
      deadline:        body.deadline ?? null,
      priority:        body.priority ?? 'medium',
      sort_order:      minOrder - 1,
      recurrence:      body.recurrence ?? 'none',
      recurrence_days: body.recurrence_days ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
