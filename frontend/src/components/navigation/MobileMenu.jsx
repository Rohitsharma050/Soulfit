import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../common/BrandLogo';
import Button from '../common/Button';
import { navigationConfig } from '../../config/navigationConfig';

export default function MobileMenu({ isOpen, onClose }) {
  const location = useLocation();
  const [servicesExpanded, setServicesExpanded] = useState(false);

  // Close menu on location change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-forest/60 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-sand-50 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto lg:hidden border-l border-beige"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Top Bar with Brand & Close Button */}
            <div className="p-6 border-b border-beige flex items-center justify-between">
              <BrandLogo variant="dark" />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-brand text-forest hover:bg-beige/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="px-6 py-6 flex-1 space-y-4">
              <div className="space-y-1">
                <Link
                  to="/"
                  className={`block px-3 py-2.5 rounded-brand font-serif text-xl ${
                    location.pathname === '/' ? 'text-terracotta font-semibold bg-sand' : 'text-forest hover:bg-beige/40'
                  }`}
                >
                  Home
                </Link>

                <Link
                  to="/about"
                  className={`block px-3 py-2.5 rounded-brand font-serif text-xl ${
                    location.pathname === '/about' ? 'text-terracotta font-semibold bg-sand' : 'text-forest hover:bg-beige/40'
                  }`}
                >
                  About Rashmi
                </Link>

                {/* Services Accordion Item */}
                <div className="rounded-brand overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setServicesExpanded(!servicesExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-brand font-serif text-xl text-forest hover:bg-beige/40 text-left transition-colors"
                    aria-expanded={servicesExpanded}
                  >
                    <span>Our Five Pillars</span>
                    <ChevronDown className={`w-5 h-5 text-olive transition-transform duration-normal ${servicesExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {servicesExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-4 pr-2 py-2 space-y-1 bg-beige/30 rounded-brand mt-1"
                      >
                        <Link
                          to="/services"
                          className="block px-3 py-2 text-xs font-semibold uppercase tracking-widest text-terracotta hover:underline"
                        >
                          View All Services Overview &rarr;
                        </Link>
                        {navigationConfig.links.find(l => l.isDropdown)?.items.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className="block px-3 py-2 rounded-brand text-sm text-forest/90 hover:bg-sand transition-colors"
                          >
                            <span className="font-medium block">{subItem.name}</span>
                            <span className="text-[11px] text-olive">{subItem.subtitle}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/journal"
                  className={`block px-3 py-2.5 rounded-brand font-serif text-xl ${
                    location.pathname === '/journal' ? 'text-terracotta font-semibold bg-sand' : 'text-forest hover:bg-beige/40'
                  }`}
                >
                  Journal &amp; Insights
                </Link>

                <Link
                  to="/contact"
                  className={`block px-3 py-2.5 rounded-brand font-serif text-xl ${
                    location.pathname === '/contact' ? 'text-terracotta font-semibold bg-sand' : 'text-forest hover:bg-beige/40'
                  }`}
                >
                  Contact
                </Link>
              </div>

              {/* Consultation Call to Action */}
              <div className="pt-6 border-t border-beige space-y-3">
                <Button
                  to="/#consultation"
                  variant="primary"
                  size="lg"
                  className="w-full text-center"
                  onClick={onClose}
                >
                  Book Consultation
                </Button>
                <p className="text-center text-xs text-olive italic font-serif">
                  “Healing is an unbroken circle of Self, Space, and Fuel.”
                </p>
              </div>
            </div>

            {/* Footer Tagline */}
            <div className="p-6 bg-sand border-t border-beige text-center">
              <span className="text-[11px] uppercase tracking-widest text-olive font-mono">
                The Harmony Project &bull; Founded by Rashmi
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
