import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { CreateTodoPayload } from '@/lib/types';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  const body: CreateTodoPayload = await request.json();

  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  // Put new todo at top (sort_order = 0, shift others)
  // Simpler: use a large negative to prepend, or just set 0 and rely on created_at
  const { data: existing } = await supabase
    .from('todos')
    .select('sort_order')
    .order('sort_order', { ascending: true })
    .limit(1);

  const minOrder = existing?.[0]?.sort_order ?? 0;

  const { data, error } = await supabase
    .from('todos')
    .insert({
      text: body.text.trim(),
      completed: false,
      deadline: body.deadline ?? null,
      priority: body.priority ?? 'medium',
      sort_order: minOrder - 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
