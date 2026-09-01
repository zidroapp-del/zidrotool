import { supabase } from '@/lib/supabase';

export async function hasAdminAccess(userId: string | undefined) {
  if (!userId || !supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id !== userId) return false;
  if (user.app_metadata?.role === 'admin') return true;
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  return !error && !!data;
}
