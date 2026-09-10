import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { RefreshCw } from 'lucide-react';

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  const fullName = data.user.user_metadata?.full_name;
  const emailName = data.user.email?.split('@')[0];
  const userName = fullName || (emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : 'Counsel');
  const initialQuery = searchParams?.q || '';

  return (
    <Suspense
      fallback={
        <div className="h-screen bg-navy-950 flex items-center justify-center text-slate-300 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-gold-400 mr-2" />
          <span>Loading MARE-Juris Legal Workspace...</span>
        </div>
      }
    >
      <ChatInterface
        userName={userName}
        userEmail={data.user.email || ''}
        initialQuery={initialQuery}
      />
    </Suspense>
  );
}
