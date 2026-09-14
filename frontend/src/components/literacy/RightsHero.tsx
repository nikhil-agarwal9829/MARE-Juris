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
    <section className="relative pt-32 pb-16 px-4 md:px-8 border-b border-slate-200 overflow-hidden bg-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-3xl max-h-3xl bg-blue-50 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 mb-6 animate-fade-in-up">
          <Scale className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">
            Verified Legal Intelligence
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Know Your Rights
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Understand Indian laws through simple explanations, practical examples, and verified legal sources. Explore protections across property, consumer, and cyber law.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative mb-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-white border-2 border-slate-200 text-slate-900 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400 text-base font-medium shadow-sm hover:border-slate-300"
              placeholder="Search rights, laws, topics or Acts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4 text-xs font-medium text-slate-500">
            <span>Examples:</span>
            <button onClick={() => setSearchQuery('Tenant')} className="hover:text-primary transition-colors underline decoration-slate-200 underline-offset-4">Tenant rights</button>
            <button onClick={() => setSearchQuery('Refund')} className="hover:text-primary transition-colors underline decoration-slate-200 underline-offset-4">Consumer refund</button>
            <button onClick={() => setSearchQuery('Data')} className="hover:text-primary transition-colors underline decoration-slate-200 underline-offset-4">Data protection</button>
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
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-slate-900'
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
