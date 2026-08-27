import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { NewsRail } from '@/components/news/NewsRail';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-navy-950 p-4 md:p-8 flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center">
        <LoginForm />
      </div>

      {/* Bottom Horizontal News Pulse Ticker */}
      <div className="max-w-6xl w-full mx-auto mt-8 border-t border-slate-800/80 pt-6">
        <NewsRail compact />
      </div>
    </main>
  );
}
