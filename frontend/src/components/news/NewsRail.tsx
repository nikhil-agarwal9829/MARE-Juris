'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Newspaper, AlertCircle, RefreshCw } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { NewsSkeleton } from './NewsSkeleton';
import type { NewsArticle } from '@/app/api/news/route';

export const NewsRail: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Failed to load news');
      const data = await res.json();
      if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        setArticles(data.articles);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="news-section" className="w-full my-8 scroll-mt-24">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-slate-200 text-primary text-xs font-semibold uppercase tracking-wider">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Legal & Business Pulse</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mt-2">
            {compact ? 'Recent Legal Developments' : 'Legal & Business Pulse'}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-1">
            Recent developments relevant to courts, law and business.
          </p>
        </div>

        {/* Scroll Controls for Desktop */}
        {!loading && !error && articles.length > 0 && (
          <div className="flex items-center gap-2 self-end">
            <span className="text-xs text-slate-500 mr-2 hidden md:inline">
              Showing {articles.length} articles
            </span>
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-blue-300 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-blue-300 transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <NewsSkeleton />
      ) : error || articles.length === 0 ? (
        <div className="p-8 rounded-2xl legal-card text-center border border-slate-200 bg-white my-4 max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-primary/90 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Legal & Business Pulse is temporarily unavailable.
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              We couldn&apos;t reach the legal news provider. Please try refreshing.
            </p>
          </div>
          <button
            onClick={fetchNews}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-primary hover:text-primary-hover text-xs font-semibold transition-all cursor-pointer shadow-sm hover:border-blue-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto py-3 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 pb-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
};
