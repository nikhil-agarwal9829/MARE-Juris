'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  FileSearch,
  BookOpen,
  Building2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Gavel,
  Landmark,
  CheckCircle2,
  Send,
  Info,
  Scale,
  Shield,
  Search,
  Upload,
  Folder,
  Compass,
  FileCheck,
  Check,
} from 'lucide-react';
import { ScalesOfJustice3D } from '@/components/visual/ScalesOfJustice3D';
import { ComplianceScene3D } from '@/components/visual/ComplianceScene3D';
import { NewsRail } from '@/components/news/NewsRail';
import { Navbar } from '@/components/navigation/Navbar';
import { FloatingAssistant } from '@/components/assistant/FloatingAssistant';

interface HomeContentProps {
  userName: string | null;
  userEmail: string;
}

export const HomeContent: React.FC<HomeContentProps> = ({ userName }) => {
  const [query, setQuery] = useState('');
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const handleSuggestedQuestion = (q: string) => {
    router.push(`/chat?q=${encodeURIComponent(q)}`);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div id="top" className="min-h-screen bg-background flex flex-col justify-between relative">
      {/* 1. Unified Fixed Header Navigation Bar */}
      <Navbar userName={userName} mode="home" />

      {/* Main Content Body */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-24 pb-16 space-y-16 flex-1">
        {/* 2. Welcome Hero Section */}
        <section className="legal-card rounded-3xl p-6 md:p-10 border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-sm">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evidence-Grounded Legal Support</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold font-serif text-slate-900 leading-tight">
              Hello, <span className="text-primary">{userName || 'Guest'}</span>
            </h1>

            <p className="text-lg md:text-xl font-medium text-slate-700 font-serif">
              What do you want to do today?
            </p>

            <p className="text-xs md:text-sm text-slate-500 max-w-xl leading-relaxed">
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
          <div className="legal-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all bg-white">
            <div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold font-serif text-slate-900 text-lg">Ask MARE-Juris</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Understand Indian law with evidence-grounded answers.
              </p>
            </div>
            <button
              onClick={() => router.push('/ask-juris')}
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-primary border border-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all cursor-pointer"
            >
              <span>Start a conversation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Legal Literacy */}
          <div className="legal-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all bg-white">
            <div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 w-fit mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold font-serif text-slate-900 text-lg">Know Your Rights</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Interactive real-world scenarios covering statutory rights under Indian law.
              </p>
            </div>
            <button
              onClick={() => router.push('/literacy')}
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-primary text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>Explore Legal Literacy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Analyze Document */}
          <div className="legal-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all bg-white">
            <div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 w-fit mb-4 group-hover:scale-110 transition-transform">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="font-bold font-serif text-slate-900 text-lg">Analyze a Document</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Identify important clauses, obligations and potential risks.
              </p>
            </div>
            <button
              onClick={() =>
                setModalMessage('Document Parsing & Risk Extraction Pipeline is scheduled for the upcoming release.')
              }
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-primary text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>Analyze document</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 4: Business Compliance */}
          <div className="legal-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between group hover:border-slate-300 hover:shadow-md transition-all bg-white">
            <div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 w-fit mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold font-serif text-slate-900 text-lg">Business Compliance</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Describe a business idea and generate your statutory compliance roadmap.
              </p>
            </div>
            <button
              onClick={() => router.push('/compliance')}
              className="mt-6 inline-flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-primary text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>Start Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 4. Section: Legal Quick Access ("Explore Legal Information") */}
        <section id="legal-intelligence-section" className="space-y-6 scroll-mt-24">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Corpus Knowledge Base
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mt-1">
              Explore Legal Information
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Start with the information you need across Indian legal authorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Acts & Statutes', desc: 'Central & State enactments', icon: Landmark },
              { title: 'Case Law', desc: 'Supreme Court & High Court judgments', icon: Gavel },
              { title: 'Rules & Regulations', desc: 'Government notifications & rules', icon: FileText },
              { title: 'Government Notifications', desc: 'Gazette updates & circulars', icon: Compass },
              { title: 'Legal Documents', desc: 'Contracts, notices & pleadings', icon: FileSearch },
            ].map((cat, idx) => (
              <div
                key={idx}
                className="legal-card rounded-xl p-5 border-slate-200 hover:border-blue-300 hover:shadow-md bg-white transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() =>
                  setModalMessage(`Corpus Indexing for ${cat.title} will be configured in the RAG retrieval pipeline milestone.`)
                }
              >
                <div>
                  <cat.icon className="w-6 h-6 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-slate-900 text-sm font-serif">{cat.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Section: Know Your Rights */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Legal Literacy & Awareness
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mt-1">
              Know Your Rights
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Informational guides covering key areas of Indian statutory protections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Tenant Rights',
                desc: 'Rent control statutes, security deposit rules, and eviction procedures under state legislation.',
                tag: 'Property Law',
              },
              {
                title: 'Consumer Rights',
                desc: 'Protections against unfair trade practices and defect services under Consumer Protection Act 2019.',
                tag: 'Consumer Law',
              },
              {
                title: 'Employment Rights',
                desc: 'Notice periods, severance benefits, working hours, and industrial disputes provisions.',
                tag: 'Labor Law',
              },
              {
                title: 'Digital & Cyber Rights',
                desc: 'Data privacy rights, DPDP Act compliance, and remedies against online fraud.',
                tag: 'Cyber Law',
              },
              {
                title: 'Women & Family Law',
                desc: 'Maintenance, domestic violence protection, inheritance rights, and matrimonial remedies.',
                tag: 'Family Law',
              },
              {
                title: 'Business Rights',
                desc: 'Intellectual property protections, contract enforcement, and commercial dispute resolution.',
                tag: 'Corporate Law',
              },
            ].map((topic, idx) => (
              <div
                key={idx}
                className="legal-card bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
                onClick={() => router.push(`/literacy?category=${encodeURIComponent(topic.title)}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                    {topic.tag}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 text-base font-serif group-hover:text-blue-600 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{topic.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Section: Business Compliance */}
        <section id="compliance-section" className="legal-card bg-white rounded-3xl p-6 md:p-10 border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center scroll-mt-24 shadow-sm">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Corporate Compliance Monitor</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900">
              Business Compliance
            </h2>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              Keep track of legal and regulatory obligations under Companies Act, GST, Shops & Establishments, Labour Codes, and Environmental norms.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                'Companies Act Filings Audit',
                'Upcoming Regulatory Obligations',
                'Document Vault & Signatures',
                'Automated Compliance Alerts',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium">
                Note: Compliance Engine features are currently in demo view.
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ComplianceScene3D />
          </div>
        </section>

        {/* 7. Section: Your Legal Workspace */}
        <section className="legal-card bg-white rounded-3xl p-6 md:p-8 border border-slate-200 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Document Management
              </span>
              <h2 className="text-2xl font-bold font-serif text-slate-900 mt-1">
                Your Legal Workspace
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload legal agreements, briefs, or contracts for AI evidence extraction.
              </p>
            </div>
            <button
              onClick={() => setModalMessage('Document Upload & Workspace Storage is scheduled for Phase 3.')}
              className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Recent Documents', count: '0 Files', icon: Folder, note: 'No recent uploads' },
              { title: 'Saved Precedents', count: '0 Citations', icon: BookOpen, note: 'No saved cases' },
              { title: 'Document Analysis', count: 'Coming Soon', icon: FileCheck, note: 'AI risk scanner' },
            ].map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                <item.icon className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-slate-900 text-sm font-serif">{item.title}</h4>
                <p className="text-xs text-slate-500">{item.note}</p>
                <span className="text-[10px] inline-block px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Section: Ask MARE-Juris Chat Input */}
        <section id="ask-mare-section" ref={chatRef} className="legal-card bg-white rounded-3xl p-6 md:p-10 border border-slate-200 space-y-6 scroll-mt-24 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Future RAG Engine</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mt-2">
              Ask MARE-Juris
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
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
                className="w-full p-4 pr-14 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none"
              />
              <button
                type="submit"
                className="absolute right-3 bottom-4 p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover transition-all shadow-sm cursor-pointer"
                title="Send Query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested Question Pills */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
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
                    className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 text-xs transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </section>

        {/* 9. Section: How MARE-Juris Works ("From Question to Evidence") */}
        <section className="legal-card bg-white rounded-3xl p-6 md:p-10 border border-slate-200 text-center space-y-8 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              System Architecture Vision
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mt-1">
              From Question to Evidence
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto mt-1">
              How MARE-Juris transforms complex legal queries into verified citations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { step: '1', title: 'User Question', desc: 'Natural language query input', icon: Search },
              { step: '2', title: 'Legal Sources', desc: 'Statutes & case law retrieval', icon: BookOpen },
              { step: '3', title: 'Relevant Evidence', desc: 'Clause matching & ranking', icon: Scale },
              { step: '4', title: 'Verification', desc: 'Citation authority check', icon: Check },
              { step: '5', title: 'Clear Explanation', desc: 'Structured, plain-English output', icon: FileText },
            ].map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 relative group hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xs font-bold font-serif">
                  {s.step}
                </div>
                <s.icon className="w-5 h-5 text-slate-400 mx-auto group-hover:text-blue-600 transition-colors" />
                <h4 className="font-bold text-slate-900 text-xs md:text-sm font-serif">{s.title}</h4>
                <p className="text-[11px] text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 10. Section: Trust / Evidence */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="legal-card bg-white rounded-2xl p-6 border border-slate-200 space-y-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 w-fit">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold font-serif text-slate-900 text-base">Evidence-Grounded</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Answers are designed around verified Indian legal sources rather than ungrounded language generation.
            </p>
          </div>

          <div className="legal-card bg-white rounded-2xl p-6 border border-slate-200 space-y-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 w-fit">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold font-serif text-slate-900 text-base">Transparent Citations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Users can trace explanations directly back to specific statutory sections and court precedents.
            </p>
          </div>

          <div className="legal-card bg-white rounded-2xl p-6 border border-slate-200 space-y-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 w-fit">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold font-serif text-slate-900 text-base">Human-Readable Terms</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dense legal jargon is translated into structured, understandable insights for practitioners and citizens.
            </p>
          </div>
        </section>

        {/* 11. Legal & Business Pulse Horizontal News Rail */}
        <NewsRail />
      </main>

      {/* 12. Floating Gemini Assistant Button & Panel */}
      <FloatingAssistant />

      {/* Modal / Dialog for Features under Development */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base font-serif">Feature Milestone</h3>
            </div>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {modalMessage}
            </p>
            <div className="pt-2 text-right">
              <button
                onClick={() => setModalMessage(null)}
                className="px-5 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover transition-all cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 bg-white">
        <p>© 2026 MARE-Juris Legal Intelligence Platform. Evidence Grounded & Citation Verified.</p>
      </footer>
    </div>
  );
};

