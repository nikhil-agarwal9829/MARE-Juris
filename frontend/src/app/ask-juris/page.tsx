import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { RefreshCw } from 'lucide-react';

export default async function AskJurisPage({
  searchParams,
}: {
  searchParams?: { q?: string; chat?: string };
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
  const initialChatId = searchParams?.chat || null;

  return (
    <Suspense
      fallback={
        <div className="h-screen bg-white flex items-center justify-center text-slate-600 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
          <span>Loading Ask MARE-Juris Legal Workspace...</span>
        </div>
      }
    >
      <ChatInterface
        userName={userName}
        userEmail={data.user.email || ''}
        initialQuery={initialQuery}
        initialChatId={initialChatId}
      />
    </Suspense>
  );
}
