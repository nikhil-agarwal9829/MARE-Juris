import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { HomeContent } from '@/components/home/HomeContent';

export default async function HomePage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  // If user is not authenticated, we'll pass null values
  // so the Navbar and UI can render the "Guest" state appropriately
  let userName = null;
  let userEmail = '';

  if (data.user) {
    // Determine user display name
    const fullName = data.user.user_metadata?.full_name;
    const emailName = data.user.email?.split('@')[0];
    userName = fullName || (emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : 'Counsel');
    userEmail = data.user.email || '';
  }

  return <HomeContent userName={userName} userEmail={userEmail} />;
}
