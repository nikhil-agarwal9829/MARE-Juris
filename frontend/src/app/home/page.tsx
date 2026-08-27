import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HomeContent } from '@/components/home/HomeContent';

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  // Determine user display name
  const fullName = data.user.user_metadata?.full_name;
  const emailName = data.user.email?.split('@')[0];
  const userName = fullName || (emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : 'Counsel');

  return <HomeContent userName={userName} userEmail={data.user.email || ''} />;
}
