'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Newspaper, AlertCircle } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { NewsSkeleton } from './NewsSkeleton';
import type { NewsArticle } from '@/app/api/news/route';

export const NewsRail: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Failed to load news');
        const data = await res.json();
        if (data.articles && Array.isArray(data.articles)) {
          setArticles(data.articles);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full my-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider">
            <Newspaper className="w-4 h-4" />
            <span>Legal & Business Pulse</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-slate-100 mt-1">
            Recent Court & Regulatory Developments
          </h2>
        </div>

        {/* Control Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="p-2 rounded-xl bg-navy-900 border border-slate-700/80 text-slate-300 hover:text-gold-300 hover:border-gold-500/40 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="p-2 rounded-xl bg-navy-900 border border-slate-700/80 text-slate-300 hover:text-gold-300 hover:border-gold-500/40 transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Rail Container */}
      {loading ? (
        <NewsSkeleton />
      ) : error || articles.length === 0 ? (
        <div className="p-8 rounded-2xl legal-card text-center border border-slate-800/80 my-4">
          <AlertCircle className="w-8 h-8 text-gold-400/80 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-300">
            Legal & Business news pulse is currently updating.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Please check back shortly for recent Indian court and regulatory proceedings.
          </p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-none py-3 scroll-smooth no-scrollbar"
        >
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
};
