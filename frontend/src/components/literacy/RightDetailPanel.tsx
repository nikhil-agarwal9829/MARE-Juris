import React, { useEffect, useState } from 'react';
import { Right } from '@/data/legalLiteracyData';
import { X, ShieldCheck, ExternalLink, CheckCircle2, AlertTriangle, Scale, BookOpen, HelpCircle } from 'lucide-react';

interface RightDetailPanelProps {
  right: Right | null;
  onClose: () => void;
}

export const RightDetailPanel: React.FC<RightDetailPanelProps> = ({ right, onClose }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Prevent body scroll when panel is open and reset quiz state
  useEffect(() => {
    if (right) {
      document.body.style.overflow = 'hidden';
      setSelectedAnswer(null);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [right]);

  if (!right) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto transform transition-transform animate-slide-in-right border-l border-slate-200">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {right.category}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-10">
          
          {/* Title Area */}
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
              {right.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              {right.summary}
            </p>
          </div>

          {/* Source Verification Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Scale className="w-24 h-24" />
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Verified Legal Source</span>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="pb-4 border-b border-slate-200">
                <div className="font-bold text-slate-900 text-lg mb-1">{right.source.act}</div>
                <div className="text-sm text-slate-600">{right.source.section}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Authority</div>
                  <div className="text-sm font-medium text-slate-600">{right.source.authority}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Jurisdiction</div>
                  <div className="text-sm font-medium text-slate-600">{right.source.jurisdiction}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="text-xs text-slate-500">
                Source verified:<br/>
                <span className="font-semibold text-slate-600">{new Date(right.source.verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <a 
                href={right.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                View Official Source
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              What This Means
            </h3>
            <div className="prose prose-slate max-w-none text-slate-900">
              <p className="text-base leading-relaxed">{right.explanation}</p>
            </div>
          </div>

          {/* Practical Example */}
          <div className="bg-slate-50 border-l-4 border-primary rounded-r-2xl p-5 md:p-6">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Real-World Example
            </h3>
            <p className="text-slate-600 italic leading-relaxed">
              &quot;{right.practicalExample}&quot;
            </p>
          </div>

          {/* Checklist */}
          {right.whatToCheck.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                What You Should Check
              </h3>
              <ul className="space-y-3">
                {right.whatToCheck.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional Learning Quiz */}
          {right.quiz && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 mt-6">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Test Your Understanding
              </h3>
              <p className="text-slate-900 font-medium mb-4">{right.quiz.question}</p>
              
              <div className="space-y-2">
                {right.quiz.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === right.quiz!.correctAnswerIndex;
                  const showResult = selectedAnswer !== null;
                  
                  let buttonClass = "w-full text-left p-3 rounded-xl border transition-all text-sm ";
                  
                  if (!showResult) {
                    buttonClass += "border-slate-200 bg-white hover:border-blue-300 text-slate-600 hover:text-slate-900";
                  } else {
                    if (isCorrect) {
                      buttonClass += "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-red-500 bg-red-50 text-red-700 opacity-70";
                    } else {
                      buttonClass += "border-slate-200 bg-white text-slate-400 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={showResult}
                      onClick={() => setSelectedAnswer(idx)}
                      className={buttonClass}
                    >
                      {option}
                      {showResult && isCorrect && <CheckCircle2 className="inline-block w-4 h-4 ml-2" />}
                      {showResult && isSelected && !isCorrect && <X className="inline-block w-4 h-4 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 animate-fade-in-up">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Why?</span>
                  <p className="text-sm text-slate-600">{right.quiz.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 pt-8 border-t border-slate-200 pb-8 text-xs text-slate-500 leading-relaxed">
            <p>
              <strong>Important Disclaimer:</strong> Legal requirements can vary depending on the applicable state/local law, exact nature of the contract, and specific circumstances. This content is for general legal information and educational purposes and does not constitute formal legal advice. Always consult the official text or a legal professional for your specific situation.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
