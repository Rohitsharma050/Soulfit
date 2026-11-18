import React from 'react';
import { Link } from 'react-router-dom';
import Container from './common/Container';
import BrandLogo from './common/BrandLogo';
import NewsletterForm from './common/NewsletterForm';
import { navigationConfig } from '../config/navigationConfig';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest text-sand-light pt-16 md:pt-20 pb-10 border-t border-forest-dark" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      
      <Container size="wide">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16 border-b border-warmWhite/15">
          {/* Col 1: Brand Mission & Statement (Span 4) */}
          <div className="lg:col-span-4 space-y-5">
            <BrandLogo variant="light" size="large" />
            
            <p className="text-sm text-sand/80 leading-relaxed font-light pr-4 max-w-sm">
              The Harmony Project is a complete wellness sanctuary integrating conscious physical vitality, elemental spatial alignment, cosmic understanding and cellular nourishment into one seamless path.
            </p>

            <blockquote className="border-l-2 border-gold pl-3 py-1 my-4">
              <p className="font-serif italic text-base text-gold-light leading-snug">
                “When you take care of yourself, you create the strength to take on everything else.”
              </p>
            </blockquote>

            <p className="text-xs text-sand/60">
              Where Ancient Wisdom Meets Conscious Living &bull; Soulfit Sanctuary
            </p>
          </div>

          {/* Col 2: Five Pillars (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              Five Pillars
            </h3>
            <ul className="space-y-2.5 text-sm" role="list">
              {navigationConfig.footer.servicesCol.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-sand/80 hover:text-gold transition-colors inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Navigation & Explore (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm" role="list">
              {navigationConfig.footer.exploreCol.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-sand/80 hover:text-gold transition-colors inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Cosmic & Wellness Digest (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              Wellness Digest
            </h3>
            <p className="text-xs text-sand/80 leading-relaxed font-light">
              Receive thoughtful weekly reflections on restorative yoga, seasonal nourishment, mindful movement, and balanced living.
            </p>

            <div className="pt-2">
              <NewsletterForm variant="footer" />
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sand/60">
          <p>
            &copy; {currentYear} The Harmony Project — Soulfit. All rights reserved.
          </p>

          <nav className="flex items-center gap-6" aria-label="Legal Navigation">
            {navigationConfig.footer.legal.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="hover:text-gold transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
