import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!data) {
    // Return default stats if no row yet
    return NextResponse.json({
      user_id: user.id, xp: 0, streak: 0,
      last_completed_date: null, total_completed: 0, badges: [],
    });
  }
  return NextResponse.json(data);
}
