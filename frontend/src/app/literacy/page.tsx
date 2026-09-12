'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { RightsHero } from '@/components/literacy/RightsHero';
import { RightCard } from '@/components/literacy/RightCard';
import { RightDetailPanel } from '@/components/literacy/RightDetailPanel';
import { getCategories, Right } from '@/data/legalLiteracyData';
import { rightsData } from '@/data/legalLiteracyData';
import { Moon, Sun } from 'lucide-react';

export default function LiteracyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Rights');
  const [selectedRight, setSelectedRight] = useState<Right | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  const categories = getCategories();

  // Filter logic
  const filteredRights = useMemo(() => {
    return rightsData.filter(right => {
      const matchesCategory = activeCategory === 'All Rights' || right.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = q === '' || 
        right.title.toLowerCase().includes(q) || 
        right.summary.toLowerCase().includes(q) ||
        right.explanation.toLowerCase().includes(q) ||
        right.source.act.toLowerCase().includes(q) || 
        right.source.section.toLowerCase().includes(q);
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isLightMode ? 'literacy-light-theme' : 'literacy-dark-theme'} bg-[var(--background)]`}>
      <Navbar mode="home" />

      {/* Theme Toggle Button (Fixed on bottom right) */}
      <button
        onClick={() => setIsLightMode(!isLightMode)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] shadow-lg hover:border-[var(--gold)]/50 transition-all group"
        title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        {isLightMode ? <Moon className="w-5 h-5 group-hover:text-[var(--gold)]" /> : <Sun className="w-5 h-5 group-hover:text-[var(--gold)]" />}
      </button>

      <main className="flex-grow flex flex-col relative z-10">
        <RightsHero 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {searchQuery ? 'Search Results' : 'Rights Library'}
              </h2>
              <span className="text-sm font-medium text-[var(--text-muted)]">
                {filteredRights.length} rights found
              </span>
            </div>

            {filteredRights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRights.map((right) => (
                  <RightCard 
                    key={right.id} 
                    right={right} 
                    onClick={setSelectedRight} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-[var(--surface)] border border-[var(--border)] rounded-3xl">
                <p className="text-xl text-[var(--text-secondary)] mb-4">No rights found matching your criteria.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All Rights'); }}
                  className="px-6 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--background)] font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Slide-out Panel */}
      <RightDetailPanel 
        right={selectedRight} 
        onClose={() => setSelectedRight(null)} 
      />
    </div>
  );
}
