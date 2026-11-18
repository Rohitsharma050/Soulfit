/**
 * Centralized Brand Configuration
 * 
 * Defines official brand names, taglines, logo paths, and display dimensions.
 * To update the official logo:
 * 1. Place your official logo file (PNG, SVG, or WebP) in:
 *    frontend/public/assets/brand/
 * 2. Update the `src` or `srcTransparent` path below if using a different filename.
 */

export const brandConfig = {
  brandName: 'The Harmony Project',
  companyName: 'Soulfit',
  fullTitle: 'The Harmony Project — Soulfit',
  tagline: 'Where Ancient Wisdom Meets Conscious Living',
  subTagline: 'The complete fitness programme',
  
  logo: {
    // Primary official logo asset (Client-supplied asset)
    src: '/assets/brand/soulfit-logo.png',
    srcTransparent: '/assets/brand/soulfit-logo-transparent.png',
    srcFallbackJpg: '/assets/brand/soulfit-logo.jpg',
    
    // Expected alternative paths supported out-of-the-box:
    // '/assets/brand/logo.svg'
    // '/assets/brand/logo.png'
    // '/assets/brand/logo.webp'
    
    alt: 'Soulfit — The complete fitness programme',
    aspectRatio: '698 / 229',
    
    // Desktop sizing
    desktopHeight: 'h-11', // ~44px
    desktopWidth: 'w-auto max-w-[170px]',
    
    // Mobile sizing
    mobileHeight: 'h-9',  // ~36px
    mobileWidth: 'w-auto max-w-[135px]',
    
    // Sizing in footer
    footerHeight: 'h-12',
    footerWidth: 'w-auto max-w-[185px]',
  },
  
  colors: {
    forest: '#1E2C24',
    sand: '#FBF9F5',
    terracotta: '#C87D55',
    gold: '#D4AF37',
    olive: '#65745B',
    beige: '#EDE7DC',
  },
};

export default brandConfig;
