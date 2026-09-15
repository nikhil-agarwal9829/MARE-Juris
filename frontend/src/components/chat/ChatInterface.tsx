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
} from 'lucide-react';

interface Citation {
  citation_id?: string;
  document_title?: string;
  title?: string;
  act?: string;
  section?: string;
  subsection?: string;
  page?: string;
  authority?: string;
  jurisdiction?: string;
  evidence_text?: string;
  source_url?: string;
  source_type?: string;
  retrieved_at?: string;
  // Legacy
  statute?: string;
  snippet?: string;
  confidence?: string;
  url?: string;
}

interface Verification {
  verified: boolean;
  issues: string[];
}

interface RagWebData {
  status: string;
  answer: string;
  coverage_status?: string;
  citations: Citation[];
  evidence: any[];
  sources: string[];
  verification: Verification;
}

const ragCoverageLabel = (status?: string) => {
  if (status === 'fully_supported') return { text: 'Fully supported', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (status === 'partially_supported' || status === 'partial') return { text: 'Partially supported', className: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (status === 'not_supported' || status === 'not_available') return { text: 'Not supported', className: 'text-slate-600 bg-slate-100 border-slate-200' };
  return { text: 'Unknown', className: 'text-slate-600 bg-slate-100 border-slate-200' };
};

interface FollowUpInfo {
  required?: boolean;
  question?: string | null;
  reason?: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  rag?: RagWebData;
  web?: RagWebData;
  followUp?: FollowUpInfo;
  isFiltered?: boolean;
  createdAt: string;
  // Legacy
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
  const [comparisonData, setComparisonData] = useState<Record<string, any>>({});
  const [isComparing, setIsComparing] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMounted = useRef(false);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load User Conversation Threads (User Isolated)
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
          const loadedMsgs: Message[] = data.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            rag: m.metadata?.rag,
            web: m.metadata?.web,
            followUp: m.metadata?.follow_up,
            isFiltered: m.metadata?.is_filtered,
            createdAt: m.created_at,
            // Legacy fallbacks
            ragContent: m.metadata?.rag_content,
            ragCitations: m.metadata?.rag_citations || [],
            webContent: m.metadata?.web_content,
            webCitations: m.metadata?.web_citations || [],
            citations: m.metadata?.citations || [],
          }));

          // Deduplicate messages safely in case of rapid re-renders
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

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || input;
    if (!text.trim() || loading) return;

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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch legal response');
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
          ? (data.rag?.answer || followUp?.question || 'I need one clarification to answer accurately.')
          : (data.rag?.answer || data.content || data.rag_content),
        rag: clarificationOnly ? undefined : data.rag,
        web: clarificationOnly ? undefined : data.web,
        followUp,
        isFiltered: data.is_filtered || false,
        createdAt: new Date().toISOString(),
        ragContent: data.rag_content,
        webContent: data.web_content,
      };

      setMessages((prev) => {
        // Prevent duplicate appending if the active Conv ID effect already caught it
        if (prev.find(m => m.id === assistantMessage.id)) return prev;
        return [...prev, assistantMessage];
      });
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'I apologize, an error occurred while executing legal evidence retrieval. Please check your query or consult again.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareSources = async (msg: Message) => {
    const ragAns = msg.rag?.answer || msg.ragContent || msg.content || '';
    const webAns = msg.web?.answer || msg.webContent || '';
    if (!ragAns || !webAns) return;
    setIsComparing(msg.id);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const userQuery = messages.find(m => m.id === msg.id)?.content ||
        messages.filter(m => m.role === 'user' && m.createdAt < msg.createdAt).pop()?.content || '';

      const res = await fetch('/api/assistant/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          query: userQuery,
          rag_content: ragAns,
          web_content: webAns
        })
      });

      if (!res.ok) throw new Error('Comparison failed');
      const data = await res.json();
      setComparisonData(prev => ({ ...prev, [msg.id]: data }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(null);
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

  const toggleCitations = (msgId: string) => {
    setExpandedCitations((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
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
            <span className="font-serif font-bold text-lg tracking-wide text-primary">
              Ask MARE-Juris
            </span>
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
        {/* Left Sidebar - Conversations (User Isolated) */}
        <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-4 shrink-0 hidden md:flex">
          <button
            onClick={startNewChat}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-hover mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>New Legal Consultation</span>
          </button>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-2">
            Consultation History
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
                  className={`p-3 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between group ${activeConvId === conv.id
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
        <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto my-8 text-center space-y-6">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-primary w-fit mx-auto">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
                    Ask MARE-Juris Legal Assistant
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Evidence-grounded statutory reasoning for Indian legal procedures, statutes, and case precedents.
                  </p>
                </div>

                {/* Suggested Starters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-2">
                  {[
                    { label: 'Tenant Rights', query: 'What are my rights as a tenant against unlawful landlord eviction under Indian law?' },
                    { label: 'Company Incorporation', query: 'What documents are mandatory to incorporate a Private Limited Company under Companies Act 2013?' },
                    { label: 'Legal Notice Response', query: 'How do I draft a formal response to a legal notice under Contract Law?' },
                    { label: 'IPC / BNS Explanation', query: 'Explain Section 420 of IPC and its counterpart in Bharatiya Nyaya Sanhita (BNS).' },
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
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-3xl mx-auto flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-primary flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="space-y-4 w-full">
                    {msg.role === 'assistant' ? (
                      msg.followUp?.required ? (
                        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 max-w-2xl space-y-2">
                          <div className="text-[11px] font-bold uppercase text-primary">Clarification needed</div>
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
                        <div className="flex flex-col xl:flex-row gap-4 w-full">
                          {/* RAG PANEL */}
                          <div className="flex-1 min-w-[300px]">
                            <div className="flex items-center gap-2 mb-2 px-1">
                              <div className="px-3 py-1 text-[11px] font-bold rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                                MARE-JURIS RAG
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase">Controlled Corpus</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                              {msg.rag?.coverage_status && (
                                <div className={`inline-flex text-[10px] font-semibold px-2 py-1 rounded-lg border ${ragCoverageLabel(msg.rag.coverage_status).className}`}>
                                  RAG Coverage: {ragCoverageLabel(msg.rag.coverage_status).text}
                                </div>
                              )}
                              <div className="prose max-w-none text-sm text-slate-800 leading-relaxed prose-headings:font-serif prose-headings:text-primary prose-headings:font-bold prose-strong:text-slate-900 prose-a:text-blue-600">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.rag?.answer || msg.ragContent || msg.content || ''}
                                </ReactMarkdown>
                              </div>

                              {/* Evidence Used Panel */}
                              {(msg.rag?.citations || msg.ragCitations || []).length > 0 && (
                                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 mt-4">
                                  <div onClick={() => toggleCitations(`${msg.id}-rag`)} className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-700 mb-2 hover:text-primary transition-colors">
                                    <div className="flex items-center gap-2">
                                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                      <span>Evidence Used ({(msg.rag?.citations || msg.ragCitations || []).length})</span>
                                    </div>
                                    {expandedCitations[`${msg.id}-rag`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </div>
                                  {expandedCitations[`${msg.id}-rag`] && (
                                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-200">
                                      {(msg.rag?.citations || msg.ragCitations || []).map((cit, idx) => (
                                        <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                                          <div className="font-bold text-slate-800 mb-1">{cit.document_title || cit.statute}</div>
                                          <div className="text-slate-600 mb-1">{cit.section} {cit.subsection ? `(${cit.subsection})` : ''}</div>
                                          <p className="text-slate-600 italic border-l-2 border-primary/40 pl-2 py-0.5">&quot;{cit.evidence_text || cit.snippet}&quot;</p>
                                          <div className="mt-2 flex justify-between items-center text-[10px]">
                                            <span className="text-slate-500">Authority: {cit.authority}</span>
                                            {(cit.source_url || cit.url) && (
                                              <a href={cit.source_url || cit.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                View Official Source ↗
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* WEB PANEL */}
                          {(msg.web || msg.webContent) && !msg.isFiltered && (
                            <div className="flex-1 min-w-[300px]">
                              <div className="flex items-center gap-2 mb-2 px-1">
                                <div className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                                  LIVE OFFICIAL RESEARCH
                                </div>
                                <span className="text-[10px] text-slate-500 uppercase">Live APIs</span>
                              </div>
                              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                                <div className="prose max-w-none text-sm text-slate-800 leading-relaxed prose-headings:font-serif prose-headings:text-emerald-700 prose-headings:font-bold prose-strong:text-slate-900 prose-a:text-emerald-600">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.web?.answer || msg.webContent || ''}
                                  </ReactMarkdown>
                                </div>

                                {/* Evidence Used Panel */}
                                {(msg.web?.citations || msg.webCitations || []).length > 0 && (
                                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 mt-4">
                                    <div onClick={() => toggleCitations(`${msg.id}-web`)} className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-700 mb-2 hover:text-emerald-700 transition-colors">
                                      <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        <span>Evidence Used ({(msg.web?.citations || msg.webCitations || []).length})</span>
                                      </div>
                                      {expandedCitations[`${msg.id}-web`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                    {expandedCitations[`${msg.id}-web`] && (
                                      <div className="space-y-2 mt-2 pt-2 border-t border-slate-200">
                                        {(msg.web?.citations || msg.webCitations || []).map((cit, idx) => (
                                          <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
                                            <div className="font-bold text-slate-800 mb-1">{cit.title || cit.document_title || cit.statute}</div>
                                            <div className="text-slate-600 mb-1">{cit.section}</div>
                                            <p className="text-slate-600 italic border-l-2 border-emerald-500/40 pl-2 py-0.5">&quot;{cit.evidence_text || cit.snippet}&quot;</p>
                                            <div className="mt-2 flex justify-between items-center text-[10px]">
                                              <span className="text-slate-500">Authority: {cit.authority}</span>
                                              {(cit.source_url || cit.url) && (
                                                <a href={cit.source_url || cit.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                                                  View Official Source ↗
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="p-4 rounded-2xl text-sm leading-relaxed bg-primary text-white font-medium rounded-tr-none shadow-md w-fit ml-auto">
                        <span>{msg.content}</span>
                      </div>
                    )}

                    {/* Common Footer Actions */}
                    {msg.role === 'assistant' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 max-w-3xl">
                          <button onClick={() => copyContent(msg.id, msg.rag?.answer || msg.ragContent || msg.content || '')} className="hover:text-primary transition-colors flex items-center gap-1">
                            {copiedId === msg.id ? <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-600">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy RAG</span></>}
                          </button>

                          {(msg.rag?.answer || msg.ragContent || msg.content) && (msg.web?.answer || msg.webContent) && !msg.isFiltered && (
                            <button onClick={() => handleCompareSources(msg)} disabled={isComparing === msg.id} className="hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1 disabled:opacity-50 border border-slate-300 px-3 py-1.5 rounded-lg bg-white shadow-sm">
                              {isComparing === msg.id ? <><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Comparing...</span></> : <><Scale className="w-3.5 h-3.5 text-primary" /><span>Run Source Comparison</span></>}
                            </button>
                          )}
                        </div>

                        {/* Comparison Panel */}
                        {comparisonData[msg.id] && (
                          <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm mt-2 space-y-3 w-full max-w-4xl">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-indigo-100 pb-2">
                              <Scale className="w-4 h-4" />
                              Source Comparison Analysis
                            </div>
                            <p className="text-sm text-slate-700">{comparisonData[msg.id].summary}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              {comparisonData[msg.id].agreements?.length > 0 && (
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                                  <div className="font-bold mb-1.5">Agreements</div>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {comparisonData[msg.id].agreements.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                  </ul>
                                </div>
                              )}

                              {comparisonData[msg.id].differences?.length > 0 && (
                                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs">
                                  <div className="font-bold mb-1.5">Differences</div>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {comparisonData[msg.id].differences.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {comparisonData[msg.id].freshness_flags?.length > 0 && (
                              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs mt-2">
                                <div className="flex items-center gap-1.5 font-bold mb-1.5"><AlertTriangle className="w-4 h-4" /> Corpus Freshness Warning</div>
                                <ul className="list-disc pl-4 space-y-1">
                                  {comparisonData[msg.id].freshness_flags.map((flag: string, i: number) => <li key={i}>{flag}</li>)}
                                </ul>
                              </div>
                            )}

                            {comparisonData[msg.id].potential_conflicts?.length > 0 && (
                              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs mt-2">
                                <div className="flex items-center gap-1.5 font-bold mb-1.5"><AlertTriangle className="w-4 h-4" /> Source Conflicts Detected</div>
                                <ul className="list-disc pl-4 space-y-1">
                                  {comparisonData[msg.id].potential_conflicts.map((conflict: string, i: number) => <li key={i}>{conflict}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="max-w-3xl mx-auto flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3 text-xs text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing statutory provisions & case precedents...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Bar */}
          <div className="p-4 bg-white border-t border-slate-200 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="max-w-3xl mx-auto relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a legal query under Indian Law..."
                className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-all disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
