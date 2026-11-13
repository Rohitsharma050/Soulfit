import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowRight, Menu } from 'lucide-react';
import BrandLogo from './common/BrandLogo';
import Button from './common/Button';
import MobileMenu from './navigation/MobileMenu';
import Container from './common/Container';
import { navigationConfig } from '../config/navigationConfig';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Scroll detection for sticky header transition without layout shift
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const servicesItem = navigationConfig.links.find((item) => item.isDropdown);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-normal ${
          isScrolled
            ? 'bg-sand/95 backdrop-blur-md border-b border-beige shadow-soft py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <Container size="wide">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <BrandLogo variant="dark" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2" aria-label="Main Navigation">
              <Link
                to="/"
                className={`px-3.5 py-2 text-sm font-medium transition-colors rounded-brand ${
                  location.pathname === '/' 
                    ? 'text-terracotta font-semibold' 
                    : 'text-forest hover:text-terracotta'
                }`}
              >
                Home
              </Link>

              <Link
                to="/about"
                className={`px-3.5 py-2 text-sm font-medium transition-colors rounded-brand ${
                  location.pathname === '/about' 
                    ? 'text-terracotta font-semibold' 
                    : 'text-forest hover:text-terracotta'
                }`}
              >
                About Rashmi
              </Link>

              {/* Services Dropdown (All 5 Pillars) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors rounded-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                    dropdownOpen || location.pathname.startsWith('/services')
                      ? 'text-terracotta font-semibold'
                      : 'text-forest hover:text-terracotta'
                  }`}
                >
                  <span>Our 5 Pillars</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-normal ${
                      dropdownOpen ? 'rotate-180 text-terracotta' : 'text-olive'
                    }`}
                  />
                </button>

                {/* Dropdown Menu Flyout */}
                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute top-full left-0 mt-2 w-80 bg-sand-50 rounded-brand-lg shadow-elevated border border-beige p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-fast"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-3 py-2 mb-1 border-b border-beige/60 flex items-center justify-between">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-terracotta font-semibold">
                        Wellness Disciplines
                      </span>
                      <Link
                        to="/services"
                        className="text-[11px] text-olive hover:text-forest underline"
                        onClick={() => setDropdownOpen(false)}
                      >
                        All Services Overview
                      </Link>
                    </div>

                    <div className="space-y-1">
                      {servicesItem?.items.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setDropdownOpen(false)}
                          className="flex flex-col px-3 py-2.5 rounded-brand hover:bg-beige/40 transition-colors group"
                          role="menuitem"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-serif font-medium text-forest group-hover:text-terracotta transition-colors">
                              {subItem.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sand border border-beige text-olive">
                              {subItem.badge}
                            </span>
                          </div>
                          <span className="text-xs text-olive/80 line-clamp-1 mt-0.5 font-light">
                            {subItem.subtitle}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/journal"
                className={`px-3.5 py-2 text-sm font-medium transition-colors rounded-brand ${
                  location.pathname === '/journal' 
                    ? 'text-terracotta font-semibold' 
                    : 'text-forest hover:text-terracotta'
                }`}
              >
                Insights
              </Link>

              <Link
                to="/contact"
                className={`px-3.5 py-2 text-sm font-medium transition-colors rounded-brand ${
                  location.pathname === '/contact' 
                    ? 'text-terracotta font-semibold' 
                    : 'text-forest hover:text-terracotta'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-4">
              <Button
                to="/#consultation"
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                className="hidden sm:inline-flex"
              >
                Book Consultation
              </Button>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-brand text-forest hover:bg-beige/50 transition-colors lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                aria-label="Open mobile navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
