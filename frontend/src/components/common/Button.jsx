import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'right',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-sans font-medium transition-all duration-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variantClasses = {
    primary: 'bg-forest text-sand hover:bg-forest-light active:bg-forest-dark shadow-soft hover:shadow-elevated rounded-brand',
    secondary: 'bg-sand text-forest border border-beige hover:border-olive/50 active:bg-sand-dark rounded-brand',
    terracotta: 'bg-terracotta text-warmWhite hover:bg-terracotta-dark active:bg-terracotta-dark shadow-soft hover:shadow-elevated rounded-brand',
    gold: 'bg-gold text-forest hover:bg-gold-light active:bg-gold-dark shadow-soft rounded-brand',
    outline: 'border border-forest/30 text-forest hover:border-forest hover:bg-forest/5 active:bg-forest/10 rounded-brand',
    ghost: 'text-forest hover:bg-beige/40 active:bg-beige/70 rounded-brand',
  };

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 tracking-wide',
    md: 'text-sm px-5 py-2.5 gap-2 tracking-wide',
    lg: 'text-base px-7 py-3.5 gap-2.5 tracking-wide',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`;

  const content = (
    <>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClasses} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  );
}
