import React from 'react';
import { Search, Shield, Scale, ArrowRight } from 'lucide-react';

interface RightsHeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const RightsHero: React.FC<RightsHeroProps> = ({
  searchQuery,
  setSearchQuery,
  categories,
  activeCategory,
  setActiveCategory
}) => {
  return (
    <section className="relative pt-32 pb-16 px-4 md:px-8 border-b border-[var(--border)] overflow-hidden bg-[var(--background)]">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-3xl max-h-3xl bg-[var(--gold)]/5 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] mb-6 animate-fade-in-up">
          <Scale className="w-4 h-4 text-[var(--gold)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            Verified Legal Intelligence
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[var(--text-primary)] mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Know Your Rights
        </h1>

        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Understand Indian laws through simple explanations, practical examples, and verified legal sources. Explore protections across property, consumer, and cyber law.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative mb-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--gold)] transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text-primary)] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[var(--gold)]/50 focus:ring-4 focus:ring-[var(--gold)]/10 transition-all placeholder:text-[var(--text-muted)] text-base font-medium shadow-sm hover:border-[var(--border-hover)]"
              placeholder="Search rights, laws, topics or Acts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4 text-xs font-medium text-[var(--text-muted)]">
            <span>Examples:</span>
            <button onClick={() => setSearchQuery('Tenant')} className="hover:text-[var(--gold)] transition-colors underline decoration-[var(--border)] underline-offset-4">Tenant rights</button>
            <button onClick={() => setSearchQuery('Refund')} className="hover:text-[var(--gold)] transition-colors underline decoration-[var(--border)] underline-offset-4">Consumer refund</button>
            <button onClick={() => setSearchQuery('Data')} className="hover:text-[var(--gold)] transition-colors underline decoration-[var(--border)] underline-offset-4">Data protection</button>
          </div>
        </div>
      </div>

      {/* Category Navigation (Horizontal scrollable) */}
      <div className="max-w-7xl mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar gap-2 justify-start md:justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-[var(--text-primary)] text-[var(--background)] shadow-md'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--gold)]/30 hover:text-[var(--text-primary)]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
