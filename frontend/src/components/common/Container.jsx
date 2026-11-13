import React from 'react';

/**
 * Reusable Container Component
 * Enforces consistent responsive gutters and max-widths across all views.
 */
export default function Container({ children, className = '', size = 'default' }) {
  const sizeClasses = {
    narrow: 'max-w-4xl',
    default: 'max-w-7xl',
    wide: 'max-w-[1440px]',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 w-full ${sizeClasses[size] || sizeClasses.default} ${className}`}>
      {children}
    </div>
  );
}
