'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Calendar, Newspaper, ArrowUpRight } from 'lucide-react';
import { LegalPlaceholder } from '@/components/visual/LegalPlaceholder';
import type { NewsArticle } from '@/app/api/news/route';

export const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const [imgError, setImgError] = useState(false);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const categoryName = article.categories[0]
    ? article.categories[0].toUpperCase()
    : 'LEGAL PULSE';

  return (
    <div className="w-80 md:w-96 flex-shrink-0 scroll-snap-align-start legal-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-slate-800/80 hover:border-gold-500/50 transition-all duration-300 shadow-lg">
      <div>
        {/* Header Image or Fallback */}
        <div className="relative w-full h-44 bg-navy-950 overflow-hidden">
          {article.imageUrl && !imgError ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              onError={() => setImgError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 320px, 384px"
              unoptimized
            />
          ) : (
            <LegalPlaceholder category={article.categories[0] || 'legal'} />
          )}

          {/* Category Tag Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-navy-950/85 backdrop-blur-md border border-gold-500/30 text-[10px] font-bold uppercase tracking-wider text-gold-300 shadow-md">
            {categoryName}
          </div>
        </div>

        {/* Article Body */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2.5 flex-wrap">
            <span className="flex items-center gap-1 text-gold-400/90 font-semibold tracking-wide">
              <Newspaper className="w-3.5 h-3.5" />
              {article.sourceName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {formattedDate}
            </span>
          </div>

          <h3 className="font-bold text-slate-100 text-sm md:text-base line-clamp-2 leading-snug group-hover:text-gold-300 transition-colors font-serif">
            {article.title}
          </h3>

          <p className="text-xs text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
            {article.description}
          </p>
        </div>
      </div>

      {/* Card Action Link */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-950/50 flex items-center justify-between">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors group/link"
        >
          <span>Read Full Article</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
        </a>
        <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-gold-400/70 transition-colors" />
      </div>
    </div>
  );
};
