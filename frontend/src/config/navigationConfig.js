/**
 * Navigation Configuration
 * Centralized navigation paths, labels, and dropdown structures.
 */

export const navigationConfig = {
  brand: {
    name: 'The Harmony Project',
    tagline: 'HOLISTIC LIVING ECOSYSTEM',
    founder: 'Rashmi',
  },
  links: [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    {
      label: 'Services',
      path: '/services',
      isDropdown: true,
      items: [
        {
          name: 'Soulfit — Gym & Yoga',
          subtitle: 'Restorative movement & lifelong disorder care',
          path: '/services/yoga-wellness',
          badge: 'Physical Mastery',
        },
        {
          name: 'Vastu — Spatial Geometry',
          subtitle: 'Five elements & spatial alignment for homes and offices',
          path: '/services/vastu',
          badge: 'Spatial Harmony',
        },
        {
          name: 'Astrology — Cosmic Blueprint',
          subtitle: 'Planetary transits, energetic cycles & conscious timing',
          path: '/services/astrology',
          badge: 'Cosmic Wisdom',
        },
        {
          name: 'Corporate Wellbeing',
          subtitle: 'Workplace restorative workshops & stress reduction',
          path: '/services/corporate-wellbeing',
          badge: 'Organizational Health',
        },
        {
          name: 'Food as Medicine',
          subtitle: 'Systemic cellular nourishment & seasonal Ritucharya',
          path: '/services/food-as-medicine',
          badge: 'Bio-Fuel',
        },
      ],
    },
    { label: 'Journal', path: '/journal' },
    { label: 'Contact', path: '/contact' },
  ],
  cta: {
    label: 'Book Consultation',
    path: '/#consultation',
  },
  footer: {
    servicesCol: [
      { label: 'Soulfit & Yoga Life', path: '/services/yoga-wellness' },
      { label: 'Vastu Spatial Alignment', path: '/services/vastu' },
      { label: 'Astrology Consultations', path: '/services/astrology' },
      { label: 'Corporate Wellbeing Programs', path: '/services/corporate-wellbeing' },
      { label: 'Food as Medicine Plans', path: '/services/food-as-medicine' },
    ],
    exploreCol: [
      { label: 'About Founder Rashmi', path: '/about' },
      { label: 'Our Core Philosophy', path: '/#philosophy' },
      { label: 'Journal & Insights', path: '/journal' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'Book a Consultation', path: '/#consultation' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Ethics in Guidance', path: '/ethics' },
    ],
  },
};

export default navigationConfig;
