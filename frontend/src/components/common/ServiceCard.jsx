import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Activity, Compass, Moon, Building2, Apple, CheckCircle2 } from 'lucide-react';

const iconMap = {
  Activity,
  Compass,
  Moon,
  Building2,
  Apple,
};

export default function ServiceCard({ service, featured = false, className = '' }) {
  const IconComponent = iconMap[service.iconName] || Activity;

  return (
    <div 
      className={`group relative flex flex-col justify-between bg-sand-50 rounded-2xl border border-beige/80 transition-all duration-normal hover:shadow-elevated hover:border-olive/30 overflow-hidden ${
        featured ? 'lg:col-span-2 p-8 md:p-10' : 'p-6 sm:p-8'
      } ${className}`}
    >
      {/* Top Banner / Icon & Badge */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-brand flex items-center justify-center bg-sand text-forest border border-beige transition-transform duration-normal group-hover:scale-105">
              <IconComponent className="w-5 h-5 text-terracotta" />
            </div>
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] font-semibold text-terracotta">
              {service.badge}
            </span>
          </div>

          <span className="text-xs text-olive font-serif italic">
            {service.category}
          </span>
        </div>

        {/* Title & Tagline */}
        <h3 className="font-serif text-2xl sm:text-3xl text-forest font-normal mb-2 group-hover:text-terracotta transition-colors">
          {service.name}
        </h3>
        <p className="text-xs sm:text-sm uppercase tracking-wider text-olive font-medium mb-4">
          {service.title}
        </p>

        {/* Narrative Description */}
        <p className="text-sm text-forest/80 leading-relaxed font-light mb-6">
          {featured ? service.detailedDescription : service.shortDescription}
        </p>

        {/* Key Offerings List (shown in featured or expanded views) */}
        {service.offerings && (
          <div className="space-y-2 mb-8 pt-4 border-t border-beige/60">
            {service.offerings.slice(0, featured ? 4 : 3).map((offering, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-olive">
                <CheckCircle2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0 mt-0.5" />
                <span>{offering}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-auto flex items-center justify-between border-t border-beige/40">
        <Link 
          to={service.path}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest uppercase tracking-widest hover:text-terracotta transition-colors group-hover:underline"
        >
          <span>Explore Sanctuary</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
        <span className="text-[10px] text-olive/60 font-mono">0{service.displayOrder} / 05</span>
      </div>
    </div>
  );
}
