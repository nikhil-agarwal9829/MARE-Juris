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
      className="group relative flex flex-col p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Subtle hover gradient background */}
      <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Category & Verified Badge */}
        <div className="flex items-start justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
            <BookOpen className="w-3.5 h-3.5" />
            {right.category}
          </span>
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200" title="Verified against official source">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Verified</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">
          {right.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-slate-600 leading-relaxed flex-grow">
          {right.summary}
        </p>

        {/* Footer / CTA */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
            Source: {right.source.authority}
          </span>
          <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
            <span>Learn more</span>
            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
