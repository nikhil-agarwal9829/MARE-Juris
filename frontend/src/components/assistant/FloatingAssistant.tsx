'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, Bot, User, AlertCircle, RefreshCw, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLegalRedirect?: boolean;
  targetUrl?: string;
  buttonText?: string;
}

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: 'Hello! I am the MARE-Juris Product & Website Assistant. How can I help you navigate the platform today?',
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
      const res = await fetch('/api/website-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'The website assistant is temporarily unavailable.');
      } else if (data.response) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          isLegalRedirect: data.isLegalRedirect,
          targetUrl: data.targetUrl,
          buttonText: data.buttonText,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      setErrorMsg('The website assistant is temporarily unavailable.');
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
          aria-label="Open website help assistant"
          className="p-3.5 md:p-4 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-semibold text-xs border-2 border-white group"
        >
          <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform text-white" />
          <span className="hidden sm:inline font-serif font-bold">Platform Guide</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up selection:bg-blue-100 selection:text-primary">
          {/* Panel Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-primary">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-sm">Website Assistant</h3>
                <span className="text-[10px] text-slate-500 block font-medium">Platform & Navigation Guide</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer shadow-sm transition-colors"
              aria-label="Close assistant panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-300">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-primary self-start flex-shrink-0 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="space-y-2 max-w-[85%]">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white font-medium rounded-br-xs shadow-md'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-xs shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Direct Action Link to Ask MARE-Juris if user asked a legal question */}
                  {msg.isLegalRedirect && msg.targetUrl && (
                    <div className="pt-1">
                      <Link
                        href={msg.targetUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-all"
                      >
                        <span>{msg.buttonText || 'Open Ask MARE-Juris →'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-primary self-start flex-shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Checking guide...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Panel Input Area */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <div className="relative flex items-center">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about website, features, or navigation..."
                disabled={loading}
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 text-xs resize-none disabled:opacity-50 transition-all shadow-sm"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-all cursor-pointer shadow-sm"
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
