import React from 'react';
import { Right } from '@/data/legalLiteracyData';
import { ShieldCheck, ChevronRight, BookOpen } from 'lucide-react';

interface RightCardProps {
  right: Right;
  onClick: (right: Right) => void;
}

export const RightCard: React.FC<RightCardProps> = ({ right, onClick }) => {
  return (
    <div
      onClick={() => onClick(right)}
      className="group relative flex flex-col p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--gold)]/50 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Subtle hover gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Category & Verified Badge */}
        <div className="flex items-start justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold)] uppercase tracking-wider bg-[var(--gold)]/10 px-2.5 py-1 rounded-md">
            <BookOpen className="w-3.5 h-3.5" />
            {right.category}
          </span>
          <div className="flex items-center gap-1 text-[var(--success)] bg-[var(--success)]/10 px-2 py-1 rounded border border-[var(--success)]/20" title="Verified against official source">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Verified</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--gold)] transition-colors">
          {right.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-grow">
          {right.summary}
        </p>

        {/* Footer / CTA */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--text-muted)] truncate max-w-[200px]">
            Source: {right.source.authority}
          </span>
          <div className="flex items-center gap-1 text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors">
            <span>Learn more</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
