import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo Component
 * Renders the official sun-and-circle sacred emblem and refined typography.
 * Supports light and dark variations.
 */
export default function BrandLogo({ variant = 'dark', className = '' }) {
  const isDark = variant === 'dark'; // Dark text on light background (default)
  
  return (
    <Link 
      to="/" 
      className={`inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-brand ${className}`}
      aria-label="The Harmony Project Home"
    >
      {/* Sacred Sun & Cosmos Medallion */}
      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-transform duration-normal group-hover:scale-105 shadow-soft ${
        isDark ? 'bg-forest text-gold' : 'bg-sand text-forest border border-gold/30'
      }`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3.5"
          strokeLinecap="round"
        >
          {/* Central Sanctuary Core */}
          <circle cx="50" cy="50" r="14" fill={isDark ? '#D4AF37' : '#1E2C24'} stroke="none" />
          <circle cx="50" cy="50" r="24" stroke={isDark ? '#FBF9F5' : '#C87D55'} strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
          
          {/* 12 Radiant Rays representing Cosmic Alignment */}
          <line x1="50" y1="12" x2="50" y2="20" />
          <line x1="50" y1="80" x2="50" y2="88" />
          <line x1="12" y1="50" x2="20" y2="50" />
          <line x1="80" y1="50" x2="88" y2="50" />
          
          <line x1="23" y1="23" x2="29" y2="29" />
          <line x1="71" y1="71" x2="77" y2="77" />
          <line x1="23" y1="77" x2="29" y2="71" />
          <line x1="71" y1="29" x2="77" y2="23" />
        </svg>
      </div>

      {/* Brand Name & Subtitle */}
      <div className="flex flex-col">
        <span className={`font-serif text-xl sm:text-2xl leading-none font-medium tracking-tight ${
          isDark ? 'text-forest' : 'text-sand-light'
        }`}>
          The Harmony Project
        </span>
        <span className={`text-[10px] sm:text-[11px] font-sans uppercase tracking-[0.22em] font-semibold mt-1 ${
          isDark ? 'text-terracotta' : 'text-gold'
        }`}>
          Holistic Living Ecosystem
        </span>
      </div>
    </Link>
  );
}
