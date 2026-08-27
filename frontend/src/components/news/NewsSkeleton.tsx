'use client';

import React from 'react';

export const NewsSkeleton: React.FC = () => {
  return (
    <div className="flex gap-6 overflow-hidden py-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-80 md:w-96 flex-shrink-0 legal-card rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse"
        >
          <div className="w-full h-44 bg-slate-800/60 rounded-xl" />
          <div className="h-4 bg-slate-800/80 rounded w-1/3" />
          <div className="h-4 bg-slate-800/80 rounded w-full" />
          <div className="h-4 bg-slate-800/80 rounded w-4/5" />
          <div className="h-3 bg-slate-800/60 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};
