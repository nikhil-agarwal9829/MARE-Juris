'use client';

import React from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { FloatingAssistant } from '@/components/assistant/FloatingAssistant';
import { ComplianceInterface } from '@/components/compliance/ComplianceInterface';

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between selection:bg-gold-500 selection:text-navy-950 relative">
      <Navbar mode="home" />

      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-24 pb-16 space-y-12 flex-1">
        <ComplianceInterface />
      </main>

      <FloatingAssistant />

      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 MARE-Juris Legal Intelligence Platform. Evidence Grounded & Citation Verified.</p>
      </footer>
    </div>
  );
}
