'use client';

import React from 'react';
import { Scale, Landmark, BookOpen, ShieldCheck } from 'lucide-react';

interface LegalPlaceholderProps {
  category?: string;
  className?: string;
}

export const LegalPlaceholder: React.FC<LegalPlaceholderProps> = ({
  category = 'legal',
  className = '',
}) => {
  const isBusiness = category.toLowerCase().includes('business');

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-white flex flex-col items-center justify-center p-4 border border-slate-200 overflow-hidden ${className}`}
    >
      {/* Background Graphic Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#94A3B8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05]" />

      {/* Center Legal Symbol */}
      <div className="relative z-10 p-3 rounded-full bg-white/80 border border-slate-200 text-primary mb-2 shadow-sm">
        {isBusiness ? (
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        ) : (
          <Scale className="w-8 h-8 text-primary" />
        )}
      </div>

      <span className="relative z-10 text-xs font-semibold uppercase tracking-wider text-slate-500">
        MARE-Juris Legal Intelligence
      </span>
    </div>
  );
};
