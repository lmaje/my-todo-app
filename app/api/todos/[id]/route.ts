import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { UpdateTodoPayload } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createServerClient();
  const body: UpdateTodoPayload = await request.json();

  const { data, error } = await supabase
    .from('todos')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createServerClient();

  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
