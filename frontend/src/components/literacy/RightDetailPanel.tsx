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
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-[var(--background)] shadow-2xl h-full overflow-y-auto transform transition-transform animate-slide-in-right border-l border-[var(--border)]">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {right.category}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-10">
          
          {/* Title Area */}
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--text-primary)] mb-4">
              {right.title}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {right.summary}
            </p>
          </div>

          {/* Source Verification Box */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Scale className="w-24 h-24" />
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-[var(--success)]">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Verified Legal Source</span>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="pb-4 border-b border-[var(--border)]">
                <div className="font-bold text-[var(--text-primary)] text-lg mb-1">{right.source.act}</div>
                <div className="text-sm text-[var(--text-secondary)]">{right.source.section}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--border)]">
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Authority</div>
                  <div className="text-sm font-medium text-[var(--text-secondary)]">{right.source.authority}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Jurisdiction</div>
                  <div className="text-sm font-medium text-[var(--text-secondary)]">{right.source.jurisdiction}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="text-xs text-[var(--text-muted)]">
                Source verified:<br/>
                <span className="font-semibold text-[var(--text-secondary)]">{new Date(right.source.verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <a 
                href={right.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold)] hover:text-gold-400 bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                View Official Source
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
              What This Means
            </h3>
            <div className="prose prose-invert max-w-none text-[var(--text-primary)]">
              <p className="text-base leading-relaxed">{right.explanation}</p>
            </div>
          </div>

          {/* Practical Example */}
          <div className="bg-[var(--surface)] border-l-4 border-[var(--gold)] rounded-r-2xl p-5 md:p-6">
            <h3 className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Real-World Example
            </h3>
            <p className="text-[var(--text-secondary)] italic leading-relaxed">
              &quot;{right.practicalExample}&quot;
            </p>
          </div>

          {/* Checklist */}
          {right.whatToCheck.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">
                What You Should Check
              </h3>
              <ul className="space-y-3">
                {right.whatToCheck.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
                    <CheckCircle2 className="w-5 h-5 text-[var(--gold)] flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--text-secondary)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional Learning Quiz */}
          {right.quiz && (
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-5 md:p-6 mt-6">
              <h3 className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Test Your Understanding
              </h3>
              <p className="text-[var(--text-primary)] font-medium mb-4">{right.quiz.question}</p>
              
              <div className="space-y-2">
                {right.quiz.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === right.quiz!.correctAnswerIndex;
                  const showResult = selectedAnswer !== null;
                  
                  let buttonClass = "w-full text-left p-3 rounded-xl border transition-all text-sm ";
                  
                  if (!showResult) {
                    buttonClass += "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--gold)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)]";
                  } else {
                    if (isCorrect) {
                      buttonClass += "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)] font-semibold";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)] opacity-70";
                    } else {
                      buttonClass += "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-50";
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
                <div className="mt-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-fade-in-up">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Why?</span>
                  <p className="text-sm text-[var(--text-secondary)]">{right.quiz.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 pt-8 border-t border-[var(--border)] pb-8 text-xs text-[var(--text-muted)] leading-relaxed">
            <p>
              <strong>Important Disclaimer:</strong> Legal requirements can vary depending on the applicable state/local law, exact nature of the contract, and specific circumstances. This content is for general legal information and educational purposes and does not constitute formal legal advice. Always consult the official text or a legal professional for your specific situation.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
