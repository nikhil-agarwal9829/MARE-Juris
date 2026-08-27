'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Scale,
  LogOut,
  Sparkles,
  FileSearch,
  BookOpen,
  Building2,
  Search,
  ArrowRight,
  ShieldCheck,
  FileText,
  Gavel,
  Landmark,
  CheckCircle2,
  Clock,
  Send,
  Info,
} from 'lucide-react';
import { ScalesOfJustice3D } from '@/components/visual/ScalesOfJustice3D';
import { ComplianceScene3D } from '@/components/visual/ComplianceScene3D';
import { NewsRail } from '@/components/news/NewsRail';

interface HomeContentProps {
  userName: string;
  userEmail: string;
}

export const HomeContent: React.FC<HomeContentProps> = ({ userName, userEmail }) => {
  const [query, setQuery] = useState('');
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSuggestedQuestion = (q: string) => {
    setQuery(q);
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setModalMessage(
      `" ${query} "\n\nAI Reasoning & RAG Retrieval Engine is currently under active development for the next phase. Full legal evidence grounding will be live shortly!`
    );
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between selection:bg-gold-500 selection:text-navy-950">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-navy-950/85 backdrop-blur-md border-b border-gold-500/15 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400">
              <Scale className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-lg md:text-xl tracking-wide gold-gradient-text">
              MARE-Juris
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">{userName}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-navy-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-12 flex-1">
        {/* 2. Welcome Hero Section */}
        <section className="legal-card rounded-3xl p-6 md:p-10 border border-gold-500/20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evidence-Grounded Legal Support</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold font-serif text-slate-100 leading-tight">
              Hello, <span className="gold-gradient-text">{userName}</span>
            </h1>

            <p className="text-lg md:text-xl font-medium text-slate-300">
              What do you want to do today?
            </p>

            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Explore Indian statutes, regulations, judicial precedents, and legal documents backed by evidence normalization and citation verification.
            </p>
          </div>

          <div className="lg:col-span-5 relative">
            <ScalesOfJustice3D compact />
          </div>
        </section>

        {/* 3. Four Primary Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Ask MARE-Juris */}
          <div className="legal-card rounded-2xl p-6 border border-gold-500/20 flex flex-col justify-between group hover:border-gold-500/50 transition-all">
            <div>
              <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-100 text-lg">Ask MARE-Juris</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Understand Indian law with evidence-grounded answers.
              </p>
            </div>
            <button
              onClick={() => chatRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-navy-900 border border-gold-500/30 text-gold-400 text-xs font-semibold hover:bg-gold-500 hover:text-navy-950 transition-all cursor-pointer"
            >
              <span>Start a conversation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Analyze Document */}
          <div className="legal-card rounded-2xl p-6 border border-gold-500/20 flex flex-col justify-between group hover:border-gold-500/50 transition-all">
            <div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-100 text-lg">Analyze a Document</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Identify important clauses, obligations and potential risks.
              </p>
            </div>
            <button
              onClick={() =>
                setModalMessage('Document Parsing & Extraction Pipeline is under development for the next phase.')
              }
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-navy-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:border-gold-500 hover:text-gold-300 transition-all cursor-pointer"
            >
              <span>Analyze document</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Legal Information */}
          <div className="legal-card rounded-2xl p-6 border border-gold-500/20 flex flex-col justify-between group hover:border-gold-500/50 transition-all">
            <div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-100 text-lg">Find Legal Info</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Explore statutes, rules, regulations and judgments.
              </p>
            </div>
            <button
              onClick={() =>
                document.getElementById('legal-intelligence-section')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-navy-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:border-gold-500 hover:text-gold-300 transition-all cursor-pointer"
            >
              <span>Explore sources</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 4: Business Compliance */}
          <div className="legal-card rounded-2xl p-6 border border-gold-500/20 flex flex-col justify-between group hover:border-gold-500/50 transition-all">
            <div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-100 text-lg">Business Compliance</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Understand business obligations and organize compliance tasks.
              </p>
            </div>
            <button
              onClick={() =>
                document.getElementById('compliance-section')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-navy-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:border-gold-500 hover:text-gold-300 transition-all cursor-pointer"
            >
              <span>Check compliance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 4. Legal Intelligence Section */}
        <section id="legal-intelligence-section" className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
              Corpus Knowledge Base
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-100 mt-1">
              Legal Intelligence
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Start with the information you need across Indian legal authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Acts & Statutes', desc: 'Central & State enactments', icon: Landmark },
              { title: 'Case Law', desc: 'Supreme Court & High Court judgments', icon: Gavel },
              { title: 'Rules & Regulations', desc: 'Government notifications & rules', icon: FileText },
              { title: 'Legal Documents', desc: 'Contracts, notices & pleadings', icon: FileSearch },
              { title: 'Business Compliance', desc: 'Corporate filings & labor codes', icon: ShieldCheck },
            ].map((cat, idx) => (
              <div
                key={idx}
                className="legal-card rounded-xl p-5 hover:border-gold-500/40 transition-all cursor-pointer group"
                onClick={() =>
                  setModalMessage(`Corpus Indexing for ${cat.title} will be configured in the RAG pipeline milestone.`)
                }
              >
                <cat.icon className="w-6 h-6 text-gold-400 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-slate-200 text-sm">{cat.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. AI Chat Section */}
        <section ref={chatRef} className="legal-card rounded-3xl p-6 md:p-10 border border-gold-500/20 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Legal Assistant</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-100 mt-2">
              Ask MARE-Juris
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Ask a legal question and get a clear explanation grounded in legal evidence.
            </p>
          </div>

          <form onSubmit={handleChatSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What legal question can we help you understand?"
                className="w-full p-4 pr-14 bg-navy-950/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-sm resize-none"
              />
              <button
                type="submit"
                className="absolute right-3 bottom-4 p-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 hover:from-gold-400 hover:to-gold-300 transition-all shadow-md cursor-pointer"
                title="Send Query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested Question Pills */}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Suggested Legal Questions:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'What are my rights as a tenant?',
                  'How do I understand this legal notice?',
                  'What documents are required to start a business?',
                  'Explain this section of law in simple language.',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestedQuestion(q)}
                    className="px-3 py-1.5 rounded-full bg-navy-900 border border-slate-800 text-slate-300 hover:text-gold-300 hover:border-gold-500/30 text-xs transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </section>

        {/* 6. Dedicated Business Compliance Section */}
        <section id="compliance-section" className="legal-card rounded-3xl p-6 md:p-10 border border-gold-500/20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Corporate Compliance Monitor</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-100">
              Business Compliance Engine
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track regulatory obligations under Companies Act, Shops & Establishments, Labour Codes, GST, and Environmental regulations with automated risk auditing.
            </p>
            <div className="space-y-2 pt-2">
              {['Companies Act Filings Audit', 'GST & Tax Compliance', 'Labor & Employment Regulations'].map(
                (item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <ComplianceScene3D />
          </div>
        </section>

        {/* 7. Legal & Business Pulse News Rail */}
        <NewsRail />
      </main>

      {/* Modal / Dialog for Feature under Development */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full legal-card rounded-3xl p-6 border border-gold-500/30 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-base">Feature Milestone</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {modalMessage}
            </p>
            <div className="pt-2 text-right">
              <button
                onClick={() => setModalMessage(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 font-semibold text-xs transition-all cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 MARE-Juris Legal Intelligence Platform. Evidence Grounded & Citation Verified.</p>
      </footer>
    </div>
  );
};
