import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowRight, Menu, User, LogOut } from 'lucide-react';
import BrandLogo from './common/BrandLogo';
import Button from './common/Button';
import MobileMenu from './navigation/MobileMenu';
import Container from './common/Container';
import { navigationConfig } from '../config/navigationConfig';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();
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
            ? 'bg-sand/95 backdrop-blur-md border-b border-forest/10 shadow-soft py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <Container size="wide">
          <div className="flex items-center justify-between">
            {/* Brand Logo with Official Client Logo */}
            <div className="flex-shrink-0">
              <BrandLogo variant="dark" />
            </div>

            {/* Desktop Navigation Links with Strong Forest Green Presence */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2" aria-label="Main Navigation">
              <Link
                to="/"
                className={`px-3.5 py-2 text-sm font-medium transition-all rounded-brand ${
                  location.pathname === '/' 
                    ? 'text-forest font-bold bg-forest/5' 
                    : 'text-forest/80 hover:text-forest hover:bg-forest/5'
                }`}
              >
                Home
              </Link>

              <Link
                to="/about"
                className={`px-3.5 py-2 text-sm font-medium transition-all rounded-brand ${
                  location.pathname === '/about' 
                    ? 'text-forest font-bold bg-forest/5' 
                    : 'text-forest/80 hover:text-forest hover:bg-forest/5'
                }`}
              >
                About Us
              </Link>

              {/* Services Dropdown (All 5 Pillars) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-all rounded-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                    dropdownOpen || location.pathname.startsWith('/services')
                      ? 'text-forest font-bold bg-forest/5'
                      : 'text-forest/80 hover:text-forest hover:bg-forest/5'
                  }`}
                >
                  <span>Our 5 Pillars</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-normal ${
                      dropdownOpen ? 'rotate-180 text-forest' : 'text-forest/60'
                    }`}
                  />
                </button>

                {/* Dropdown Menu Flyout */}
                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute top-full left-0 mt-2 w-80 bg-sand-50 rounded-brand-lg shadow-elevated border border-forest/15 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-fast"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-3 py-2 mb-1 border-b border-forest/10 flex items-center justify-between">
                      <span className="text-[10px] font-sans uppercase tracking-widest text-forest font-bold">
                        Wellness Disciplines
                      </span>
                      <Link
                        to="/services"
                        className="text-[11px] text-forest/70 hover:text-forest underline"
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
                          className="flex flex-col px-3 py-2.5 rounded-brand hover:bg-forest/5 transition-colors group"
                          role="menuitem"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-serif font-medium text-forest group-hover:text-forest-light transition-colors">
                              {subItem.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sand border border-forest/15 text-forest/80">
                              {subItem.badge}
                            </span>
                          </div>
                          <span className="text-xs text-forest/70 line-clamp-1 mt-0.5 font-light">
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
                className={`px-3.5 py-2 text-sm font-medium transition-all rounded-brand ${
                  location.pathname === '/journal' 
                    ? 'text-forest font-bold bg-forest/5' 
                    : 'text-forest/80 hover:text-forest hover:bg-forest/5'
                }`}
              >
                Insights
              </Link>

              <Link
                to="/contact"
                className={`px-3.5 py-2 text-sm font-medium transition-all rounded-brand ${
                  location.pathname === '/contact' 
                    ? 'text-forest font-bold bg-forest/5' 
                    : 'text-forest/80 hover:text-forest hover:bg-forest/5'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3 md:gap-4">
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/my-consultations"
                    className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-forest/80 hover:text-forest hover:bg-forest/5 rounded-brand transition-colors"
                    title="My Scheduled Consultations"
                  >
                    <span>My Sessions</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest/5 hover:bg-forest/10 border border-forest/15 transition-all text-xs font-medium text-forest"
                    title="Go to Sanctuary Dashboard"
                  >
                    <span className="w-6 h-6 rounded-full bg-forest text-sand-light text-[11px] font-bold flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </span>
                    <span className="hidden md:inline max-w-[120px] truncate">{user.name}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="p-1.5 rounded-brand text-forest/60 hover:text-forest hover:bg-forest/5 transition-colors"
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest hover:text-forest-light transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              <Button
                to="/book"
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                className="hidden sm:inline-flex bg-forest hover:bg-forest-light text-sand-light shadow-soft text-xs"
              >
                Book Consultation
              </Button>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-brand text-forest hover:bg-forest/10 transition-colors lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
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
