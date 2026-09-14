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
    <div className="min-h-screen transition-colors duration-500 bg-white">
      <Navbar mode="home" />

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
              <h2 className="text-2xl font-bold text-slate-900">
                {searchQuery ? 'Search Results' : 'Rights Library'}
              </h2>
              <span className="text-sm font-medium text-slate-500">
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
              <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl">
                <p className="text-xl text-slate-600 mb-4">No rights found matching your criteria.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All Rights'); }}
                  className="px-6 py-2 rounded-xl bg-slate-900 text-white font-semibold"
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
