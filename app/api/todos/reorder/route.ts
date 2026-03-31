import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Body: { orderedIds: string[] }
export async function POST(request: Request) {
  const supabase = createServerClient();
  const { orderedIds }: { orderedIds: string[] } = await request.json();

  // Batch-update sort_order for each id
  const updates = orderedIds.map((id, index) =>
    supabase.from('todos').update({ sort_order: index }).eq('id', id)
  );

  await Promise.all(updates);
  return NextResponse.json({ ok: true });
}
