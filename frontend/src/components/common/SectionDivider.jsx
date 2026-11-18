import React from 'react';

export default function SectionDivider({ className = '', variant = 'mandala' }) {
  return (
    <div className={`relative flex items-center justify-center my-12 md:my-16 ${className}`} aria-hidden="true">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-forest/15" />
      </div>
      <div className="relative flex items-center justify-center px-4 bg-sand text-forest">
        {variant === 'mandala' ? (
          <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" fill="#1E2C24" />
            <circle cx="12" cy="12" r="8" strokeDasharray="2 2" stroke="#1E2C24" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#1E2C24" />
          </svg>
        ) : (
          <div className="w-2 h-2 rotate-45 bg-forest/60" />
        )}
      </div>
    </div>
  );
}
