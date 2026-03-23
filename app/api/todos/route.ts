import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { CreateTodoPayload } from '@/lib/types';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  const body: CreateTodoPayload = await request.json();

  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({ text: body.text.trim(), completed: false, deadline: body.deadline ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
