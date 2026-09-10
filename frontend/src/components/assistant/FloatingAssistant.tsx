'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, AlertCircle, RefreshCw, Sparkles, ShieldAlert } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: 'Hello! I am MARE Assistant, your general AI assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      buttonRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'The assistant is temporarily unavailable.');
      } else if (data.response) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      setErrorMsg('The assistant is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          aria-label="Open AI assistant"
          className="p-4 rounded-full bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 shadow-2xl shadow-gold-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-semibold text-xs border-2 border-navy-900 group"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-serif font-bold">MARE Assistant</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-96 h-[520px] max-h-[80vh] legal-card rounded-3xl border border-gold-500/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up bg-navy-950 selection:bg-gold-500 selection:text-navy-950">
          {/* Panel Header */}
          <div className="p-4 bg-navy-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-100 text-sm">MARE Assistant</h3>
                <span className="text-[10px] text-slate-400 block font-medium">General AI assistant</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-navy-950 text-slate-400 hover:text-slate-200 border border-slate-800 cursor-pointer"
              aria-label="Close assistant panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Legal Disclaimer Banner */}
          <div className="px-4 py-2 bg-navy-900/40 border-b border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldAlert className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
            <p className="leading-tight">
              For general information only. This assistant is not a substitute for professional legal advice.
            </p>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="p-1.5 rounded-lg bg-navy-900 border border-gold-500/20 text-gold-400 self-start flex-shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-navy-950 font-medium rounded-br-xs shadow-md'
                      : 'bg-navy-900/90 border border-slate-800 text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="p-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 self-start flex-shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-navy-900/60 p-3 rounded-2xl border border-slate-800 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-400" />
                <span>Thinking...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Panel Input Area */}
          <div className="p-3 bg-navy-900/90 border-t border-slate-800">
            <div className="relative flex items-center">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={loading}
                className="w-full pl-3 pr-10 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 text-xs resize-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-1.5 rounded-lg bg-gold-500 text-navy-950 hover:bg-gold-400 disabled:opacity-40 transition-all cursor-pointer"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
