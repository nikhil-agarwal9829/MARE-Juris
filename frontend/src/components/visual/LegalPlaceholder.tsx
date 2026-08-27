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
      className={`relative w-full h-full bg-gradient-to-br from-navy-900 via-navy-850 to-navy-800 flex flex-col items-center justify-center p-4 border border-gold-500/20 overflow-hidden ${className}`}
    >
      {/* Background Graphic Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

      {/* Center Legal Symbol */}
      <div className="relative z-10 p-3 rounded-full bg-navy-950/80 border border-gold-500/30 text-gold-400 mb-2 shadow-lg">
        {isBusiness ? (
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        ) : (
          <Scale className="w-8 h-8 text-gold-400" />
        )}
      </div>

      <span className="relative z-10 text-xs font-semibold uppercase tracking-wider text-gold-300/80">
        MARE-Juris Legal Intelligence
      </span>
    </div>
  );
};
