'use client';

import React from 'react';

export const ScalesOfJustice3D: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${
        compact ? 'h-48 w-full' : 'h-72 md:h-96 w-full'
      }`}
      aria-hidden="true"
    >
      {/* Outer Glow Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-gold-500/10 via-transparent to-indigo-500/10 rounded-3xl blur-3xl" />

      {/* SVG 3D-Inspired Animated Visual */}
      <svg
        viewBox="0 0 400 300"
        className="w-full h-full max-w-lg drop-shadow-[0_20px_50px_rgba(197,160,89,0.15)] animate-fade-in"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5E6C8" />
            <stop offset="50%" stopColor="#C5A059" />
            <stop offset="100%" stopColor="#8A6B29" />
          </linearGradient>

          <linearGradient id="navyGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Courthouse / Pedestal Pillar Base */}
        <path
          d="M140 260 L260 260 L240 240 L160 240 Z"
          fill="url(#goldMetallic)"
          opacity="0.9"
        />
        <rect x="180" y="100" width="40" height="140" fill="url(#navyGlass)" rx="4" stroke="url(#goldMetallic)" strokeWidth="1.5" />
        <circle cx="200" cy="80" r="14" fill="url(#goldMetallic)" filter="url(#glow)" />

        {/* Beam (Scales Axis) with subtle rotation pulse */}
        <g className="animate-scale-pulse origin-[200px_100px]">
          <rect x="80" y="96" width="240" height="8" rx="4" fill="url(#goldMetallic)" />

          {/* Left Scale Assembly */}
          <line x1="100" y1="104" x2="70" y2="170" stroke="url(#goldMetallic)" strokeWidth="1.5" opacity="0.7" />
          <line x1="100" y1="104" x2="130" y2="170" stroke="url(#goldMetallic)" strokeWidth="1.5" opacity="0.7" />
          <path d="M60 170 C60 195, 140 195, 140 170 Z" fill="url(#navyGlass)" stroke="url(#goldMetallic)" strokeWidth="2" />
          
          {/* Left Bowl Contents - Legal Document Icon */}
          <rect x="85" y="145" width="30" height="22" rx="2" fill="#0F172A" stroke="#C5A059" strokeWidth="1" />
          <line x1="90" y1="152" x2="105" y2="152" stroke="#F5E6C8" strokeWidth="1" />
          <line x1="90" y1="158" x2="110" y2="158" stroke="#F5E6C8" strokeWidth="1" />

          {/* Right Scale Assembly */}
          <line x1="300" y1="104" x2="270" y2="170" stroke="url(#goldMetallic)" strokeWidth="1.5" opacity="0.7" />
          <line x1="300" y1="104" x2="330" y2="170" stroke="url(#goldMetallic)" strokeWidth="1.5" opacity="0.7" />
          <path d="M260 170 C260 195, 340 195, 340 170 Z" fill="url(#navyGlass)" stroke="url(#goldMetallic)" strokeWidth="2" />

          {/* Right Bowl Contents - Evidence Shield Icon */}
          <path d="M300 145 L315 152 V162 C315 168 300 172 300 172 C300 172 285 168 285 162 V152 Z" fill="#C5A059" opacity="0.8" />
        </g>

        {/* Floating Citation Evidence Network Nodes */}
        <g className="animate-node-float">
          <circle cx="50" cy="80" r="5" fill="#C5A059" filter="url(#glow)" />
          <line x1="50" y1="80" x2="80" y2="100" stroke="#C5A059" strokeDasharray="3 3" opacity="0.5" />
          
          <circle cx="350" cy="70" r="6" fill="#E5C158" filter="url(#glow)" />
          <line x1="350" y1="70" x2="320" y2="100" stroke="#E5C158" strokeDasharray="3 3" opacity="0.5" />

          <circle cx="200" cy="30" r="4" fill="#F5E6C8" filter="url(#glow)" />
          <line x1="200" y1="30" x2="200" y2="66" stroke="#F5E6C8" strokeDasharray="2 2" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};
