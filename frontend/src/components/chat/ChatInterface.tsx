'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Scale,
  Send,
  Plus,
  Trash2,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
  LogOut,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface Citation {
  statute: string;
  section: string;
  authority: string;
  snippet: string;
  confidence: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
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
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userName,
  userEmail,
  initialQuery = '',
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const initialMounted = useRef(false);

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

      if (!res.ok) {
        throw new Error('Failed to fetch legal response');
      }

      const data = await res.json();

      if (!activeConvId && data.conversation_id) {
        setActiveConvId(data.conversation_id);
        const newConv: Conversation = {
          id: data.conversation_id,
          title: text.slice(0, 30) + '...',
          updated_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
      }

      const assistantMessage: Message = {
        id: data.message_id || crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        citations: data.citations || [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
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
    <div className="h-screen bg-navy-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-16 bg-navy-950/90 backdrop-blur-md border-b border-gold-500/15 px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/home"
            className="p-2 rounded-xl bg-navy-900 border border-slate-800 text-slate-400 hover:text-gold-400 hover:border-gold-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400">
              <Scale className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-lg tracking-wide gold-gradient-text">
              MARE-Juris AI Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">{userName}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl bg-navy-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <aside className="w-72 bg-navy-900/60 border-r border-gold-500/15 flex flex-col p-4 shrink-0 hidden md:flex">
          <button
            onClick={startNewChat}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>New Legal Consultation</span>
          </button>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-gold-400/80 mb-2 px-2">
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
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between group ${
                    activeConvId === conv.id
                      ? 'bg-gold-500/15 border border-gold-500/40 text-gold-300'
                      : 'hover:bg-navy-900/80 text-slate-300'
                  }`}
                >
                  <span className="truncate pr-2">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Chat Viewport */}
        <main className="flex-1 flex flex-col bg-navy-950 relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto my-12 text-center space-y-6">
                <div className="p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 w-fit mx-auto">
                  <Sparkles className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-100">
                    Welcome to MARE-Juris AI
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    Evidence-grounded statutory reasoning for Indian legal procedures, statutes, and case precedents.
                  </p>
                </div>

                {/* Suggested Starters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-4">
                  {[
                    { label: 'Tenant Rights', query: 'What are my rights as a tenant against unlawful landlord eviction under Indian law?' },
                    { label: 'Company Incorporation', query: 'What documents are mandatory to incorporate a Private Limited Company under Companies Act 2013?' },
                    { label: 'Legal Notice Response', query: 'How do I draft a formal response to a legal notice under Contract Law?' },
                    { label: 'IPC / BNS Explanation', query: 'Explain Section 420 of IPC and its counterpart in Bharatiya Nyaya Sanhita (BNS).' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      className="p-3.5 rounded-xl legal-card cursor-pointer hover:border-gold-500/40 transition-all space-y-1"
                    >
                      <span className="text-xs font-bold text-gold-400">{item.label}</span>
                      <p className="text-[11px] text-slate-300 line-clamp-2">{item.query}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-3xl mx-auto flex gap-4 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="space-y-3 max-w-2xl">
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gold-500 text-navy-950 font-medium rounded-tr-none shadow-md'
                          : 'legal-card rounded-tl-none border border-gold-500/20 text-slate-100 whitespace-pre-line'
                      }`}
                    >
                      {msg.content}

                      {msg.role === 'assistant' && (
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <button
                            onClick={() => copyContent(msg.id, msg.content)}
                            className="hover:text-gold-300 transition-colors flex items-center gap-1"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Evidence Grounding Collapsible Panel */}
                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="legal-card rounded-xl p-3 border border-gold-500/25">
                        <div
                          onClick={() => toggleCitations(msg.id)}
                          className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gold-400"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>
                              Verified Legal Evidence ({msg.citations.length} Statutory References)
                            </span>
                          </div>
                          {expandedCitations[msg.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>

                        {expandedCitations[msg.id] && (
                          <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
                            {msg.citations.map((c, i) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-navy-950/80 border border-slate-800 space-y-1"
                              >
                                <div className="flex items-center justify-between text-gold-300 font-bold">
                                  <span>{c.statute}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    {c.confidence}
                                  </span>
                                </div>
                                <div className="text-slate-300 font-semibold">{c.section}</div>
                                <p className="text-slate-400 text-[11px] italic">&quot;{c.snippet}&quot;</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="max-w-3xl mx-auto flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-navy-900 border border-gold-500/40 text-gold-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="legal-card p-4 rounded-2xl rounded-tl-none border border-gold-500/20 flex items-center gap-3 text-xs text-gold-300">
                  <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing statutory provisions & case precedents...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Bar */}
          <div className="p-4 bg-navy-950/90 border-t border-gold-500/15">
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
                className="w-full pl-4 pr-12 py-3.5 bg-navy-900 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 hover:from-gold-400 hover:to-gold-300 transition-all disabled:opacity-40 cursor-pointer"
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
