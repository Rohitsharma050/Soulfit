/**
 * Navigation Configuration
 * Centralized navigation paths, labels, and dropdown structures.
 */

export const navigationConfig = {
  brand: {
    name: 'The Harmony Project',
    tagline: 'Where Ancient Wisdom Meets Conscious Living',
    company: 'Soulfit',
  },
  links: [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    {
      label: 'Services',
      path: '/services',
      isDropdown: true,
      items: [
        {
          name: 'Soulfit — Gym & Yoga',
          subtitle: 'Restorative yoga, disorders care & lifetime energy',
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
    { label: 'Insights', path: '/journal' },
    { label: 'Contact', path: '/contact' },
  ],
  cta: {
    label: 'Book Consultation',
    path: '/#consultation',
  },
  footer: {
    servicesCol: [
      { label: 'Soulfit Restorative Yoga', path: '/services/yoga-wellness' },
      { label: 'Vastu Spatial Alignment', path: '/services/vastu' },
      { label: 'Astrology Consultations', path: '/services/astrology' },
      { label: 'Corporate Wellbeing Programs', path: '/services/corporate-wellbeing' },
      { label: 'Food as Medicine Plans', path: '/services/food-as-medicine' },
    ],
    exploreCol: [
      { label: 'About Soulfit', path: '/about' },
      { label: 'The Soulfit Philosophy', path: '/about#philosophy' },
      { label: 'Leadership Message', path: '/#leadership' },
      { label: 'Insights & Dispatches', path: '/journal' },
      { label: 'Contact Sanctuary', path: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Ethics in Guidance', path: '/ethics' },
    ],
  },
};

export default navigationConfig;
