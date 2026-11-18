import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../../config/brandConfig';

/**
 * BrandLogo Component
 * Centralizes the official client-supplied logo with responsive desktop/mobile sizing,
 * object-fit: contain, aspect-ratio preservation, and light/dark theme adaptability.
 * Gracefully falls back to a clean vector emblem and editorial text mark if the image asset is absent.
 */
export default function BrandLogo({ 
  variant = 'dark', 
  className = '', 
  showCompanionText = true,
  size = 'default' 
}) {
  const isDark = variant === 'dark'; // true: Dark styling for light background; false: Light styling for dark background (e.g. footer)
  const [imageError, setImageError] = useState(false);

  // Logo asset from centralized brandConfig
  const logoSrc = brandConfig.logo?.src || '/assets/brand/soulfit-logo.png';
  const logoAlt = brandConfig.logo?.alt || 'Soulfit — The complete fitness programme';

  // Desktop and mobile size presets
  const sizeClasses = {
    compact: 'h-7 sm:h-8 max-w-[120px] sm:max-w-[140px]',
    default: 'h-8 sm:h-10 max-w-[130px] sm:max-w-[165px]',
    large: 'h-10 sm:h-12 max-w-[150px] sm:max-w-[190px]',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.default;

  return (
    <Link 
      to="/" 
      className={`inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-brand transition-opacity hover:opacity-95 ${className}`}
      aria-label={`${brandConfig.brandName} — ${brandConfig.companyName} Home`}
    >
      {/* Official Client Logo or Fallback */}
      {!imageError ? (
        <div className={`relative flex items-center justify-center transition-transform duration-normal group-hover:scale-105 ${
          !isDark 
            ? 'bg-white px-2.5 py-1 rounded-brand shadow-sm border border-warmWhite/20' 
            : 'bg-transparent'
        }`}>
          <img
            src={logoSrc}
            alt={logoAlt}
            onError={() => setImageError(true)}
            className={`${currentSizeClass} w-auto object-contain transition-all`}
            style={{ 
              aspectRatio: '698 / 229',
              objectFit: 'contain',
            }}
            loading="eager"
          />
        </div>
      ) : (
        /* Clean Vector Brand Fallback Emblem if image asset fails to load */
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
            <circle cx="50" cy="50" r="14" fill={isDark ? '#D4AF37' : '#1E2C24'} stroke="none" />
            <circle cx="50" cy="50" r="24" stroke={isDark ? '#FBF9F5' : '#1E2C24'} strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
            <line x1="50" y1="12" x2="50" y2="20" />
            <line x1="50" y1="80" x2="50" y2="88" />
            <line x1="12" y1="50" x2="20" y2="50" />
            <line x1="80" y1="50" x2="88" y2="50" />
          </svg>
        </div>
      )}

      {/* Brand Companion Title & Subtitle */}
      {showCompanionText && (
        <div className="flex flex-col">
          <span className={`font-serif text-lg sm:text-xl leading-tight font-medium tracking-tight transition-colors ${
            isDark ? 'text-forest group-hover:text-forest-light' : 'text-sand-light group-hover:text-gold'
          }`}>
            {brandConfig.brandName}
          </span>
          <span className={`text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.22em] font-semibold mt-0.5 ${
            isDark ? 'text-forest/70' : 'text-gold'
          }`}>
            Wellness Sanctuary
          </span>
        </div>
      )}
    </Link>
  );
}
