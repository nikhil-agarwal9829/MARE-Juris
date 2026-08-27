'use client';

import React from 'react';

export const ComplianceScene3D: React.FC = () => {
  return (
    <div
      className="relative flex items-center justify-center h-64 md:h-80 w-full select-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-gold-500/10 rounded-3xl blur-2xl" />

      <svg
        viewBox="0 0 400 280"
        className="w-full h-full max-w-md drop-shadow-[0_16px_36px_rgba(16,185,129,0.12)] animate-fade-in"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="accentGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5E6C8" />
            <stop offset="100%" stopColor="#C5A059" />
          </linearGradient>

          <linearGradient id="emeraldCheck" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Corporate Office Building Base */}
        <rect x="140" y="80" width="120" height="160" rx="4" fill="url(#buildingGrad)" stroke="url(#accentGold)" strokeWidth="1.5" />
        
        {/* Building Windows */}
        <g fill="#334155" opacity="0.8">
          <rect x="160" y="100" width="20" height="20" rx="2" />
          <rect x="190" y="100" width="20" height="20" rx="2" />
          <rect x="220" y="100" width="20" height="20" rx="2" />

          <rect x="160" y="135" width="20" height="20" rx="2" />
          <rect x="190" y="135" width="20" height="20" rx="2" fill="#C5A059" opacity="0.9" />
          <rect x="220" y="135" width="20" height="20" rx="2" />

          <rect x="160" y="170" width="20" height="20" rx="2" />
          <rect x="190" y="170" width="20" height="20" rx="2" />
          <rect x="220" y="170" width="20" height="20" rx="2" />
        </g>

        {/* Floating Verified Legal Document */}
        <g className="animate-node-float">
          <rect x="60" y="110" width="90" height="110" rx="6" fill="#0F172A" stroke="url(#accentGold)" strokeWidth="1.5" />
          <line x1="75" y1="130" x2="125" y2="130" stroke="#F5E6C8" strokeWidth="2" strokeLinecap="round" />
          <line x1="75" y1="145" x2="135" y2="145" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="75" y1="160" x2="120" y2="160" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="75" y1="175" x2="110" y2="175" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Floating Shield Check Badge */}
        <g transform="translate(230, 150)" className="drop-shadow-lg">
          <path d="M40 0 L75 16 V44 C75 66 40 76 40 76 C40 76 5 66 5 44 V16 Z" fill="url(#emeraldCheck)" />
          <path d="M25 38 L35 48 L55 26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      </svg>
    </div>
  );
};
