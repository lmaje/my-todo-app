import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase-server';
import { checkNewBadges, XP_PER_PRIORITY, getLevel } from '@/lib/badges';
import type { Priority, UserStats } from '@/lib/types';

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { priority }: { priority: Priority } = await request.json();

  // Get or create stats row
  const { data: existing } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const prev: UserStats = existing ?? {
    user_id: user.id, xp: 0, streak: 0,
    last_completed_date: null, total_completed: 0, badges: [],
  };

  const xpGained = XP_PER_PRIORITY[priority];
  const newXp = prev.xp + xpGained;
  const newTotal = prev.total_completed + 1;

  // Streak logic
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = prev.streak;
  if (prev.last_completed_date === today) {
    newStreak = prev.streak; // already completed today
  } else if (prev.last_completed_date === yesterday) {
    newStreak = prev.streak + 1; // extend streak
  } else {
    newStreak = 1; // reset
  }

  const newBadges = checkNewBadges(prev, {
    xp: newXp, streak: newStreak,
    total_completed: newTotal, priority,
  });

  const allBadges = [...prev.badges, ...newBadges.map((b) => b.id)];

  const updatedStats = {
    user_id: user.id,
    xp: newXp,
    streak: newStreak,
    last_completed_date: today,
    total_completed: newTotal,
    badges: allBadges,
  };

  await supabase.from('user_stats').upsert(updatedStats);

  return NextResponse.json({
    xpGained,
    newXp,
    level: getLevel(newXp),
    streak: newStreak,
    newBadges,
  });
}
