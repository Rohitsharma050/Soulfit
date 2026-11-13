import React from 'react';

export default function SectionHeading({
  overline,
  title,
  titleAccent,
  accentPosition = 'end', // 'start' | 'end' | 'middle'
  description,
  align = 'center',
  className = '',
  titleClassName = '',
  overlineClassName = '',
  descriptionClassName = '',
}) {
  const alignClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  };

  return (
    <div className={`flex flex-col max-w-3xl ${alignClasses[align] || alignClasses.center} ${className}`}>
      {overline && (
        <span className={`text-xs md:text-sm font-sans uppercase tracking-[0.22em] text-terracotta font-semibold mb-3 ${overlineClassName}`}>
          {overline}
        </span>
      )}

      {title && (
        <h2 className={`font-serif text-3xl sm:text-4xl md:text-5xl text-forest font-normal leading-[1.15] tracking-tight mb-4 ${titleClassName}`}>
          {accentPosition === 'start' && titleAccent && (
            <span className="italic text-terracotta font-normal">{titleAccent} </span>
          )}
          {title}
          {accentPosition === 'end' && titleAccent && (
            <span className="italic text-terracotta font-normal"> {titleAccent}</span>
          )}
        </h2>
      )}

      {description && (
        <p className={`text-base sm:text-lg text-olive leading-relaxed max-w-2xl font-light ${descriptionClassName}`}>
          {description}
        </p>
      )}
    </div>
  );
}
