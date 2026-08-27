import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function IndexPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect('/home');
  } else {
    redirect('/login');
  }
}
