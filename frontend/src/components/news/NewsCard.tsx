'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink, Calendar, Newspaper } from 'lucide-react';
import { LegalPlaceholder } from '@/components/visual/LegalPlaceholder';
import type { NewsArticle } from '@/app/api/news/route';

export const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="w-80 md:w-96 flex-shrink-0 legal-card rounded-2xl overflow-hidden flex flex-col justify-between group transition-all">
      <div>
        {/* Article Image or Legal Placeholder */}
        <div className="relative w-full h-44 bg-navy-950 overflow-hidden">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 320px, 384px"
              unoptimized
            />
          ) : (
            <LegalPlaceholder category={article.categories[0] || 'legal'} />
          )}

          {/* Category Tag Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-navy-950/80 backdrop-blur-md border border-gold-500/30 text-[10px] font-semibold uppercase tracking-wider text-gold-300">
            {article.categories[0] || 'Legal Pulse'}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-gold-400/90 font-medium">
              <Newspaper className="w-3.5 h-3.5" />
              {article.sourceName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>

          <h3 className="font-semibold text-slate-100 text-sm line-clamp-2 leading-snug group-hover:text-gold-300 transition-colors">
            {article.title}
          </h3>

          <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
            {article.description}
          </p>
        </div>
      </div>

      {/* External Link Action */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-950/40">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
        >
          <span>Read Full Article</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
