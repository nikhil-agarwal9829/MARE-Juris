'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/client';
import {
  Scale,
  Send,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowLeft,
  LogOut,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Globe,
  Database,
  ExternalLink,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Info,
  FileText,
  Paperclip,
  X,
  Loader2,
} from 'lucide-react';

interface Citation {
  citation_id?: string;
  document_title?: string;
  title?: string;
  case_title?: string;
  act?: string;
  section?: string;
  subsection?: string;
  page?: string;
  court?: string;
  citation?: string;
  paragraph_reference?: string;
  publication_date?: string;
  decision_date?: string;
  authority?: string;
  jurisdiction?: string;
  evidence_text?: string;
  source_url?: string;
  source_type?: string;
  source_provider?: string;
  provenance?: string;
  retrieved_at?: string;
  official_source_verified?: boolean;
  full_text_verified?: boolean;
  // Legacy
  statute?: string;
  snippet?: string;
  confidence?: string;
  url?: string;
}

interface Verification {
  verified: boolean;
  summary?: string;
  verified_count?: number;
  unverified_count?: number;
  issues: string[];
  checks?: Array<{
    citation_id?: string;
    title: string;
    provenance?: string;
    source_url?: string;
    status: 'verified' | 'partially_verified' | 'unverified';
    reason: string;
  }>;
}

interface AgentResponseItem {
  agent_id: string;
  agent_name: string;
  status: string; // 'success' | 'empty' | 'error' | 'filtered'
  answer: string;
  citations: Citation[];
  evidence: Citation[];
  sources: string[];
  provenance: string;
  coverage_status?: string;
  retrieved_at?: string;
  errors?: string[] | null;
}

interface CombinedAnswerData {
  available: boolean;
  answer: string;
  citations: Citation[];
  synthesized_from: string[];
  generated_at?: string;
}

interface ComparisonData {
  available: boolean;
  summary: string;
  agreements: string[];
  differences: string[];
  potential_conflicts?: string[];
  freshness_flags: string[];
  conflicts: string[];
}

interface FollowUpInfo {
  required?: boolean;
  question?: string | null;
  reason?: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  selectedAgents?: string[];
  individualResponses?: Record<string, AgentResponseItem>;
  combinedAnswer?: CombinedAnswerData;
  comparison?: ComparisonData;
  verification?: Verification;
  followUp?: FollowUpInfo;
  isFiltered?: boolean;
  createdAt: string;
  // Legacy dual-agent fallbacks
  rag?: any;
  web?: any;
  ragContent?: string;
  ragCitations?: Citation[];
  webContent?: string;
  webCitations?: Citation[];
  citations?: Citation[];
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatInterfaceProps {
  userName: string;
  userEmail: string;
  initialQuery?: string;
  initialChatId?: string | null;
}

const AVAILABLE_AGENTS = [
  {
    id: 'statutory_rag',
    name: 'Statutory RAG Agent',
    badge: 'Controlled Legislation Corpus',
    description: 'Retrieves codified sections from verified Indian statutory acts (BNS, CrPC, Contract Act, etc.).',
    provenance: 'STATUTORY_CORPUS',
    icon: BookOpen,
    accentColor: 'blue',
  },
  {
    id: 'official_web',
    name: 'Live Official Web Research Agent',
    badge: 'Official Portals & India Code',
    description: 'Retrieves live legislative rules and ministry portal services directly from gov.in & nic.in.',
    provenance: 'OFFICIAL_WEB',
    icon: Globe,
    accentColor: 'emerald',
  },
  {
    id: 'case_law_corpus',
    name: 'Case-Law Corpus Agent',
    badge: 'Supabase Vector Precedents',
    description: 'Searches the curated MARE-Juris Indian case-law index using semantic vector similarity.',
    provenance: 'CASE_LAW_CORPUS',
    icon: Database,
    accentColor: 'indigo',
  },
  {
    id: 'live_case_law',
    name: 'Live Case-Law API Agent',
    badge: 'Indian Kanoon Live API',
    description: 'Retrieves external real-time court decisions and citations across Supreme Court and High Courts.',
    provenance: 'LIVE_EXTERNAL_API',
    icon: Scale,
    accentColor: 'amber',
  },
  {
    id: 'document_agent',
    name: 'Document Analysis Agent',
    badge: 'PDF, DOCX & Image Parser',
    description: 'Extracts clauses, obligations, and legal facts from uploaded contracts, briefs, and scanned documents.',
    provenance: 'DOCUMENT_ANALYSIS',
    icon: FileText,
    accentColor: 'purple',
  },
];

const PROVENANCE_BADGES: Record<string, { label: string; className: string }> = {
  STATUTORY_CORPUS: { label: 'Statutory Corpus', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  OFFICIAL_WEB: { label: 'Official Web API', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CASE_LAW_CORPUS: { label: 'Case-Law Corpus', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  LIVE_EXTERNAL_API: { label: 'Indian Kanoon API', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  DOCUMENT_ANALYSIS: { label: 'Document Analysis', className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userName,
  userEmail,
  initialQuery = '',
  initialChatId = null,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const [expandedVerification, setExpandedVerification] = useState<Record<string, boolean>>({});
  const [showAgentConfig, setShowAgentConfig] = useState(true);

  // Multi-Agent Selection State (All 4 enabled by default)
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([
    'statutory_rag',
    'official_web',
    'case_law_corpus',
    'live_case_law',
  ]);

  // Feature Options
  const [generateCombined, setGenerateCombined] = useState(true);
  const [compareSources, setCompareSources] = useState(true);
  const [verifySources, setVerifySources] = useState(false);

  // Validation warning when user tries to submit without any agent
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);

  // Uploaded Document State
  const [attachedDoc, setAttachedDoc] = useState<{
    id: string;
    name: string;
    pages: number;
    hasOcr: boolean;
    ocrWarnings: string[];
  } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMounted = useRef(false);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load User Conversation Threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          setConversations(data);
        }
      } catch (err) {
        // Telemetry fallback
      }
    };

    fetchThreads();
  }, []);

  // Load Message History when Active Conversation Changes
  useEffect(() => {
    if (!activeConvId) return;

    const fetchMessages = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', activeConvId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const loadedMsgs: Message[] = data.map((m) => {
            const meta = m.metadata || {};
            return {
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              selectedAgents: meta.selected_agents,
              individualResponses: meta.individual_responses,
              combinedAnswer: meta.combined_answer,
              comparison: meta.comparison,
              verification: meta.verification,
              followUp: meta.follow_up,
              isFiltered: meta.is_filtered,
              createdAt: m.created_at,
              // Backward compatibility
              rag: meta.rag,
              web: meta.web,
              ragContent: meta.rag_content,
              ragCitations: meta.rag_citations || [],
              webContent: meta.web_content,
              webCitations: meta.web_citations || [],
              citations: meta.citations || [],
            };
          });

          setMessages(loadedMsgs);
        }
      } catch (err) {
        // Fallback
      }
    };

    fetchMessages();
  }, [activeConvId]);

  // Initial Query Trigger
  useEffect(() => {
    if (initialQuery && !initialMounted.current) {
      initialMounted.current = true;
      handleSend(initialQuery);
    }
  });

  const toggleAgent = (agentId: string) => {
    setSelectionWarning(null);
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const selectAllAgents = () => {
    setSelectionWarning(null);
    setSelectedAgentIds(AVAILABLE_AGENTS.map((a) => a.id));
  };

  const clearAllAgents = () => {
    setSelectedAgentIds([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setDocUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Document upload and parsing failed.');
      }
      setAttachedDoc({
        id: data.document_id,
        name: data.file_name,
        pages: data.total_pages,
        hasOcr: data.has_ocr_pages,
        ocrWarnings: data.warnings || [],
      });
      // Automatically select document_agent if not already selected
      setSelectedAgentIds((prev) => (prev.includes('document_agent') ? prev : [...prev, 'document_agent']));
    } catch (err: any) {
      setDocUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || input;
    if (!text.trim() || loading) return;

    // Validate that at least one agent is selected
    if (selectedAgentIds.length === 0) {
      setSelectionWarning('Please select at least one agent before submitting your consultation.');
      return;
    }
    setSelectionWarning(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversation_id: activeConvId,
          selected_agents: selectedAgentIds,
          generate_combined: generateCombined,
          compare_sources: compareSources,
          verify_sources: verifySources,
          document_id: attachedDoc?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch multi-agent legal response');
      }

      if (!activeConvId && data.conversation_id) {
        setActiveConvId(data.conversation_id);
        const newConv: Conversation = {
          id: data.conversation_id,
          title: text.slice(0, 30) + '...',
          updated_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
        window.history.replaceState(null, '', `/ask-juris?chat=${data.conversation_id}`);
      }

      const followUp = data.follow_up as FollowUpInfo | undefined;
      const clarificationOnly = Boolean(followUp?.required);

      const assistantMessage: Message = {
        id: data.message_id || crypto.randomUUID(),
        role: 'assistant',
        content: clarificationOnly
          ? (followUp?.question || 'I need one clarification to answer accurately.')
          : (data.combined_answer?.answer || data.content),
        selectedAgents: data.selected_agents || selectedAgentIds,
        individualResponses: data.individual_responses,
        combinedAnswer: data.combined_answer,
        comparison: data.comparison,
        verification: data.verification,
        followUp,
        isFiltered: data.is_filtered || false,
        createdAt: new Date().toISOString(),
        // Legacy fallbacks
        rag: data.rag,
        web: data.web,
      };

      setMessages((prev) => {
        if (prev.find((m) => m.id === assistantMessage.id)) return prev;
        return [...prev, assistantMessage];
      });
    } catch (err: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          err.message || 'An error occurred while executing multi-agent retrieval. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
    window.history.replaceState(null, '', '/ask-juris');
  };

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    window.history.replaceState(null, '', `/ask-juris?chat=${id}`);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('conversations').delete().eq('id', id).eq('user_id', user.id);
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        startNewChat();
      }
    } catch (err) {
      // Fallback
    }
  };

  const toggleCitations = (key: string) => {
    setExpandedCitations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleVerification = (key: string) => {
    setExpandedVerification((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="h-screen bg-slate-50/50 text-slate-900 flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/home"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-blue-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-primary">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-wide text-primary">
                MARE-Juris
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Multi-Agent Legal Intelligence
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-700 font-medium">{userName}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-4 shrink-0 hidden md:flex">
          <button
            onClick={startNewChat}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-hover mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>New Legal Consultation</span>
          </button>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-2">
            Consultation Threads
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-none">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No prior legal threads. Start a consultation above.
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`p-3 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between group ${
                    activeConvId === conv.id
                      ? 'bg-blue-50 border border-blue-200 text-primary font-semibold'
                      : 'hover:bg-slate-200/50 text-slate-600'
                  }`}
                >
                  <span className="truncate pr-2">{conv.title}</span>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                    title="Delete Thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Chat Viewport */}
        <main className="flex-1 flex flex-col bg-white relative overflow-hidden">
          {/* Multi-Agent Selector Bar */}
          <div className="bg-slate-50/90 border-b border-slate-200 p-3 sm:px-6 shrink-0 transition-all">
            <div className="max-w-5xl mx-auto space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Active Legal Agents ({selectedAgentIds.length}/4)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={selectAllAgents}
                    className="text-primary hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={clearAllAgents}
                    className="text-slate-500 hover:text-slate-800 hover:underline font-semibold"
                  >
                    Clear Selection
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setShowAgentConfig((v) => !v)}
                    className="text-slate-500 hover:text-slate-800"
                    title="Toggle options panel"
                  >
                    {showAgentConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {showAgentConfig && (
                <>
                  {/* Agent Selection Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                    {AVAILABLE_AGENTS.map((agent) => {
                      const isSelected = selectedAgentIds.includes(agent.id);
                      const Icon = agent.icon;
                      return (
                        <div
                          key={agent.id}
                          onClick={() => toggleAgent(agent.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-white border-primary shadow-xs ring-1 ring-primary/20'
                              : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                              <span className="text-[11px] truncate">{agent.name}</span>
                            </div>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{agent.badge}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Independent Feature Controls */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-200 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={generateCombined}
                        onChange={(e) => setGenerateCombined(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span>Generate Combined Answer</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={compareSources}
                        onChange={(e) => setCompareSources(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span>Source Comparison Analysis</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={verifySources}
                        onChange={(e) => setVerifySources(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span>Verify Sources (Audits Citations)</span>
                    </label>
                  </div>
                </>
              )}

              {selectionWarning && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{selectionWarning}</span>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto my-8 text-center space-y-6">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-primary w-fit mx-auto">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
                    Ask MARE-Juris Legal Intelligence
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Evidence-grounded statutory reasoning and judicial precedents across four specialized agents.
                  </p>
                </div>

                {/* Suggested Starters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-2">
                  {[
                    { label: 'Electronic Evidence (s.65B)', query: 'What is the mandatory procedure and certificate requirement for admissibility of electronic records under Section 65B of Indian Evidence Act?' },
                    { label: 'Unlawful Eviction', query: 'What are the statutory rights and judicial remedies available to a tenant facing illegal eviction under Indian Tenancy laws?' },
                    { label: 'Cheque Bounce (s.138 NI Act)', query: 'What are the essential ingredients and statutory notice timeline for prosecution under Section 138 of Negotiable Instruments Act?' },
                    { label: 'Anticipatory Bail Guidelines', query: 'What principles did the Supreme Court lay down regarding anticipatory bail in Sushila Aggarwal and Arnesh Kumar?' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all space-y-1"
                    >
                      <span className="text-xs font-bold text-primary">{item.label}</span>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.query}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const indivEntries: Array<[string, any]> = msg.individualResponses
                  ? Object.entries(msg.individualResponses)
                  : msg.rag || msg.web
                  ? [
                      ...(msg.rag ? [['statutory_rag', { agent_id: 'statutory_rag', agent_name: 'Statutory RAG Agent', status: msg.rag.status, answer: msg.rag.answer, citations: msg.rag.citations || [], evidence: msg.rag.evidence || [], sources: msg.rag.sources || [], provenance: 'STATUTORY_CORPUS' }] as [string, any]] : []),
                      ...(msg.web ? [['official_web', { agent_id: 'official_web', agent_name: 'Live Official Web Research Agent', status: msg.web.status, answer: msg.web.answer, citations: msg.web.citations || [], evidence: msg.web.evidence || [], sources: msg.web.sources || [], provenance: 'OFFICIAL_WEB' }] as [string, any]] : []),
                    ]
                  : [];

                const numCols =
                  indivEntries.length === 1
                    ? 'grid-cols-1'
                    : indivEntries.length === 2
                    ? 'grid-cols-1 lg:grid-cols-2'
                    : indivEntries.length === 3
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

                return (
                  <div
                    key={msg.id}
                    className={`max-w-6xl mx-auto flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-primary flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className="space-y-4 w-full">
                      {msg.role === 'user' ? (
                        <div className="p-4 rounded-2xl text-sm leading-relaxed bg-primary text-white font-medium rounded-tr-none shadow-md w-fit ml-auto max-w-2xl">
                          <span>{msg.content}</span>
                        </div>
                      ) : msg.followUp?.required ? (
                        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 max-w-2xl space-y-2">
                          <div className="text-[11px] font-bold uppercase text-primary">Clarification Needed</div>
                          <div className="prose max-w-none text-sm text-slate-800">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content || msg.followUp.question || ''}
                            </ReactMarkdown>
                          </div>
                          {msg.followUp.reason && (
                            <p className="text-xs text-slate-500">{msg.followUp.reason}</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* 1. INDIVIDUAL AGENT RESPONSES (Above Combined Answer) */}
                          {indivEntries.length > 0 && (
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                                <span>Individual Agent Findings ({indivEntries.length} Active)</span>
                              </div>

                              <div className={`grid ${numCols} gap-3`}>
                                {indivEntries.map(([aid, item]: [string, any]) => {
                                  const provBadge = PROVENANCE_BADGES[item.provenance] || {
                                    label: item.provenance || 'EXTERNAL',
                                    className: 'bg-slate-100 text-slate-700 border-slate-200',
                                  };
                                  const citList = item.citations || item.evidence || [];
                                  const cardKey = `${msg.id}-${aid}`;

                                  return (
                                    <div
                                      key={aid}
                                      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-2">
                                          <span className="font-bold text-xs text-slate-900 truncate">
                                            {item.agent_name || aid}
                                          </span>
                                          <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${provBadge.className}`}
                                          >
                                            {provBadge.label}
                                          </span>
                                        </div>

                                        {/* Status indicator */}
                                        {item.status === 'error' && (
                                          <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-1.5">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                            <span>Agent encountered an error</span>
                                          </div>
                                        )}
                                        {item.status === 'empty' && (
                                          <div className="mb-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 shrink-0" />
                                            <span>No relevant records returned</span>
                                          </div>
                                        )}

                                        <div className="prose max-w-none text-xs text-slate-700 leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-headings:text-xs prose-strong:text-slate-900 prose-a:text-blue-600 max-h-[360px] overflow-y-auto pr-1">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {item.answer || 'No response content available.'}
                                          </ReactMarkdown>
                                        </div>
                                      </div>

                                      {/* Citations & Evidence Panel */}
                                      {citList.length > 0 && (
                                        <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs">
                                          <div
                                            onClick={() => toggleCitations(cardKey)}
                                            className="flex items-center justify-between cursor-pointer font-semibold text-slate-700 hover:text-primary transition-colors"
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>Evidence ({citList.length})</span>
                                            </div>
                                            {expandedCitations[cardKey] ? (
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                          </div>

                                          {expandedCitations[cardKey] && (
                                            <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 max-h-56 overflow-y-auto pr-1">
                                              {citList.map((cit: Citation, cIdx: number) => {
                                                const title =
                                                  cit.case_title ||
                                                  cit.document_title ||
                                                  cit.title ||
                                                  cit.statute ||
                                                  'Evidence Document';
                                                const link = cit.source_url || cit.url;
                                                const dateStr = cit.decision_date || cit.publication_date;
                                                return (
                                                  <div
                                                    key={cIdx}
                                                    className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs text-[11px] space-y-1"
                                                  >
                                                    <div className="font-bold text-slate-800 flex items-center justify-between">
                                                      <span className="truncate">{title}</span>
                                                      {dateStr && (
                                                        <span className="text-[10px] text-slate-500 font-normal">
                                                          {dateStr}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {cit.court && (
                                                      <div className="text-slate-500 italic text-[10px]">
                                                        {cit.court}
                                                      </div>
                                                    )}
                                                    {cit.citation && (
                                                      <div className="text-slate-600 text-[10px] font-mono">
                                                        {cit.citation}
                                                      </div>
                                                    )}
                                                    {cit.page && (
                                                      <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-semibold inline-block">
                                                        Page {cit.page}
                                                      </span>
                                                    )}
                                                    {cit.evidence_text && (
                                                      <p className="text-slate-600 line-clamp-3 border-l-2 border-blue-400 pl-1.5 py-0.5">
                                                        &quot;{cit.evidence_text}&quot;
                                                      </p>
                                                    )}
                                                    {link && (
                                                      <a
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline flex items-center gap-1 text-[10px] pt-0.5"
                                                      >
                                                        <span>View Source</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                      </a>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 2. COMBINED ANSWER (Full-Width, Below Individual Cards) */}
                          {msg.combinedAnswer?.available && (
                            <div className="bg-white rounded-2xl border-2 border-blue-200/80 shadow-sm p-5 space-y-3">
                              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-primary" />
                                  <h3 className="font-serif font-bold text-base text-primary">
                                    Combined Answer
                                  </h3>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  Synthesized from {msg.combinedAnswer.synthesized_from?.length || 0} agents
                                </span>
                              </div>

                              <div className="prose max-w-none text-sm text-slate-800 leading-relaxed prose-headings:font-serif prose-headings:text-primary prose-headings:font-bold prose-strong:text-slate-900 prose-a:text-blue-600">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.combinedAnswer.answer}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {/* 3. SOURCE COMPARISON ANALYSIS (After Combined Answer) */}
                          {msg.comparison?.available && (
                            <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-xs space-y-3">
                              <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-indigo-100 pb-2 text-sm">
                                <Scale className="w-4 h-4" />
                                <span>Source Comparison Analysis</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {msg.comparison.summary}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                {msg.comparison.agreements?.length > 0 && (
                                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                                    <div className="font-bold mb-1">Agreements Across Sources</div>
                                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                                      {msg.comparison.agreements.map((item, i) => (
                                        <li key={i}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {msg.comparison.differences?.length > 0 && (
                                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs">
                                    <div className="font-bold mb-1">Differences & Nuances</div>
                                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                                      {msg.comparison.differences.map((item, i) => (
                                        <li key={i}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {msg.comparison.freshness_flags?.length > 0 && (
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                  <div className="flex items-center gap-1.5 font-bold mb-1">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    <span>Corpus Freshness Warning</span>
                                  </div>
                                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                                    {msg.comparison.freshness_flags.map((flag, i) => (
                                      <li key={i}>{flag}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {((msg.comparison.conflicts || msg.comparison.potential_conflicts) || []).length > 0 && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                                  <div className="flex items-center gap-1.5 font-bold mb-1">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <span>Source Conflicts Detected</span>
                                  </div>
                                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                                    {(msg.comparison.conflicts || msg.comparison.potential_conflicts || []).map(
                                      (conflict, i) => (
                                        <li key={i}>{conflict}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. OPTIONAL CITATION VERIFICATION REPORT */}
                          {msg.verification && (
                            <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs shadow-xs space-y-2">
                              <div
                                onClick={() => toggleVerification(msg.id)}
                                className="flex items-center justify-between cursor-pointer font-bold text-emerald-800 hover:text-emerald-950"
                              >
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  <span>
                                    Citation & Source Verification ({msg.verification.verified_count || 0} Verified / {msg.verification.unverified_count || 0} External)
                                  </span>
                                </div>
                                {expandedVerification[msg.id] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>

                              {expandedVerification[msg.id] && (
                                <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                                  <p className="text-slate-600 text-[11px] mb-2">{msg.verification.summary}</p>
                                  {msg.verification.checks?.map((chk, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between text-[11px] gap-2"
                                    >
                                      <div>
                                        <span className="font-bold text-slate-800">{chk.title}</span>
                                        <p className="text-slate-500 text-[10px]">{chk.reason}</p>
                                      </div>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                          chk.status === 'verified'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : chk.status === 'partially_verified'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        {chk.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Copy Assistant Message */}
                          <div className="flex items-center justify-start text-xs text-slate-500 pt-1">
                            <button
                              onClick={() => copyContent(msg.id, msg.combinedAnswer?.answer || msg.content || '')}
                              className="hover:text-primary transition-colors flex items-center gap-1"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Answer</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {loading && (
              <div className="max-w-4xl mx-auto flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3 text-xs text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>
                    Executing selected agents ({selectedAgentIds.length}) & synthesizing legal answer...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Bar */}
          <div className="p-4 bg-white border-t border-slate-200 shadow-sm">
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Attached Document Chip */}
              {attachedDoc && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 shadow-2xs">
                  <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-semibold truncate max-w-xs">{attachedDoc.name}</span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                    {attachedDoc.pages} {attachedDoc.pages === 1 ? 'page' : 'pages'}
                  </span>
                  {attachedDoc.hasOcr && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      OCR Extracted
                    </span>
                  )}
                  {attachedDoc.ocrWarnings?.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1 font-semibold truncate max-w-sm">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{attachedDoc.ocrWarnings[0]}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachedDoc(null)}
                    className="ml-auto p-1 text-purple-600 hover:text-purple-900 rounded-lg hover:bg-purple-100 cursor-pointer"
                    title="Remove document"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload error banner */}
              {docUploadError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="flex-1">{docUploadError}</span>
                  <button
                    type="button"
                    onClick={() => setDocUploadError(null)}
                    className="p-1 text-red-600 hover:text-red-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc || loading}
                  className="p-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-600 hover:text-purple-600 hover:border-purple-300 transition-all disabled:opacity-40 cursor-pointer shadow-sm shrink-0"
                  title="Upload PDF, DOCX, or Image (PNG, JPG)"
                >
                  {uploadingDoc ? (
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      attachedDoc
                        ? `Ask a question about ${attachedDoc.name} or related legal provisions...`
                        : "Ask a legal query under Indian Law..."
                    }
                    className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
