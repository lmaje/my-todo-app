import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { todo_id, text } = await request.json();

  if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });

  const { data, error } = await supabase
    .from('subtasks')
    .insert({ todo_id, text: text.trim(), completed: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
