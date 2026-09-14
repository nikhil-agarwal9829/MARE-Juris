import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { NewsRail } from '@/components/news/NewsRail';
import { Navbar } from '@/components/navigation/Navbar';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-blue-100 selection:text-primary">
      <Navbar mode="auth" />

      <main className="pt-24 pb-12 px-4 flex-1 flex flex-col items-center justify-center space-y-12 max-w-7xl mx-auto w-full">
        <div className="w-full flex items-center justify-center">
          <LoginForm />
        </div>

        {/* Subtle Legal & Business Pulse */}
        <div className="w-full border-t border-slate-200 pt-8">
          <NewsRail compact />
        </div>
      </main>

      <footer className="border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p>© 2026 MARE-Juris Legal Intelligence Platform</p>
      </footer>
    </div>
  );
}
