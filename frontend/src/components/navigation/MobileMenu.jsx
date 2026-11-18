import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronDown, User, LogOut, LayoutDashboard, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../common/BrandLogo';
import Button from '../common/Button';
import { navigationConfig } from '../../config/navigationConfig';
import { useAuth } from '../../hooks/useAuth';

export default function MobileMenu({ isOpen, onClose }) {
  const { user, logout } = useAuth();
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
            className="fixed inset-0 bg-forest/70 backdrop-blur-sm z-40 lg:hidden"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-sand-50 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto lg:hidden border-l border-forest/15"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Top Bar with Brand & Close Button */}
            <div className="p-5 border-b border-forest/10 flex items-center justify-between">
              <BrandLogo variant="dark" />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-brand text-forest hover:bg-forest/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
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
                    location.pathname === '/' ? 'text-forest font-bold bg-forest/10' : 'text-forest hover:bg-forest/5'
                  }`}
                >
                  Home
                </Link>

                <Link
                  to="/about"
                  className={`block px-3 py-2.5 rounded-brand font-serif text-xl ${
                    location.pathname === '/about' ? 'text-forest font-bold bg-forest/10' : 'text-forest hover:bg-forest/5'
                  }`}
                >
                  About Us
                </Link>

                {/* Services Accordion Item */}
                <div className="rounded-brand overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setServicesExpanded(!servicesExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-brand font-serif text-xl text-forest hover:bg-forest/5 text-left transition-colors"
                    aria-expanded={servicesExpanded}
                  >
                    <span>Our Five Pillars</span>
                    <ChevronDown className={`w-5 h-5 text-forest/70 transition-transform duration-normal ${servicesExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {servicesExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-4 pr-2 py-2 space-y-1 bg-forest/5 rounded-brand mt-1 border-l-2 border-forest"
                      >
                        <Link
                          to="/services"
                          className="block px-3 py-2 text-xs font-semibold uppercase tracking-widest text-forest hover:underline"
                        >
                          View All Services Overview &rarr;
                        </Link>
                        {navigationConfig.links.find(l => l.isDropdown)?.items.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className="block px-3 py-2 rounded-brand text-sm text-forest hover:bg-sand transition-colors"
                          >
                            <span className="font-medium block">{subItem.name}</span>
                            <span className="text-[11px] text-forest/70">{subItem.subtitle}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/journal"
                  className={`block px-3 py-2.5 rounded-brand font-serif text-xl ${
                    location.pathname === '/journal' ? 'text-forest font-bold bg-forest/10' : 'text-forest hover:bg-forest/5'
                  }`}
                >
                  Insights &amp; Dispatches
                </Link>

                <Link
                  to="/contact"
                  className={`block px-3 py-2.5 rounded-brand font-serif text-xl ${
                    location.pathname === '/contact' ? 'text-forest font-bold bg-forest/10' : 'text-forest hover:bg-forest/5'
                  }`}
                >
                  Contact
                </Link>
              </div>

              {/* User Account / Authentication Options */}
              <div className="pt-4 pb-2 border-t border-forest/10">
                {user ? (
                  <div className="p-3 bg-forest/5 rounded-brand border border-forest/10 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-forest text-sand-light font-bold flex items-center justify-center text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-forest truncate">{user.name}</p>
                        <p className="text-[10px] text-forest/70 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to="/dashboard"
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-forest text-sand-light text-xs font-medium hover:bg-forest-light transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/my-consultations"
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-forest/20 text-forest text-xs font-medium hover:bg-forest/10 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Sessions</span>
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        onClose();
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-forest/70 hover:text-forest text-xs font-medium transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-brand border border-forest/20 text-forest text-sm font-medium hover:bg-forest/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Member Portal</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Consultation Call to Action */}
              <div className="pt-2 space-y-3">
                <Button
                  to="/book"
                  variant="primary"
                  size="lg"
                  className="w-full text-center bg-forest hover:bg-forest-light text-sand-light"
                  onClick={onClose}
                >
                  Book Consultation
                </Button>
                <p className="text-center text-xs text-forest/70 italic font-serif">
                  “Where Ancient Wisdom Meets Conscious Living.”
                </p>
              </div>
            </div>

            {/* Footer Tagline */}
            <div className="p-5 bg-sand border-t border-forest/10 text-center">
              <span className="text-[11px] uppercase tracking-widest text-forest/80 font-mono">
                The Harmony Project &bull; Soulfit Sanctuary
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
