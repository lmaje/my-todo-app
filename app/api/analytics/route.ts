import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

  const [{ data: stats }, { data: logs }] = await Promise.all([
    supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
    supabase
      .from('completion_log')
      .select('completed_at, priority')
      .eq('user_id', user.id)
      .gte('completed_at', sevenDaysAgo)
      .order('completed_at', { ascending: true }),
  ]);

  return NextResponse.json({ stats: stats ?? null, logs: logs ?? [] });
}
