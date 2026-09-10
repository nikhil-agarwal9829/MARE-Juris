'use client';

import React from 'react';

export const NewsSkeleton: React.FC = () => {
  return (
    <div className="flex gap-6 overflow-hidden py-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-80 md:w-96 flex-shrink-0 legal-card rounded-2xl overflow-hidden flex flex-col justify-between p-0 border border-slate-800/80 animate-pulse"
        >
          <div className="w-full h-44 bg-navy-900/80 rounded-t-2xl relative">
            <div className="absolute top-3 left-3 w-20 h-5 bg-slate-800/80 rounded-full" />
          </div>

          <div className="p-5 space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="h-3.5 bg-slate-800/80 rounded w-24" />
              <div className="h-3.5 bg-slate-800/80 rounded w-16" />
            </div>
            <div className="h-4 bg-slate-800/80 rounded w-full" />
            <div className="h-4 bg-slate-800/80 rounded w-4/5" />
            <div className="h-3 bg-slate-800/60 rounded w-full" />
            <div className="h-3 bg-slate-800/60 rounded w-2/3" />
          </div>

          <div className="p-4 border-t border-slate-800/80 bg-navy-950/40">
            <div className="h-3 bg-gold-500/20 rounded w-28" />
          </div>
        </div>
      ))}
    </div>
  );
};
