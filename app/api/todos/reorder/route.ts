import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderedIds }: { orderedIds: string[] } = await request.json();

  const updates = orderedIds.map((id, index) =>
    supabase.from('todos').update({ sort_order: index }).eq('id', id).eq('user_id', user.id)
  );

  await Promise.all(updates);
  return NextResponse.json({ ok: true });
}
