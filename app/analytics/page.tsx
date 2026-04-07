import { createAuthServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AnalyticsView from '@/components/AnalyticsView';

export default async function AnalyticsPage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <AnalyticsView />;
}
