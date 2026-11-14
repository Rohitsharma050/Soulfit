import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Compass, 
  Moon, 
  Building2, 
  Apple,
  Clock,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';
import { servicesConfig } from '../../config/servicesConfig';
import { servicesService } from '../../services/api';

const iconMap = {
  Activity,
  Compass,
  Moon,
  Building2,
  Apple,
};

// Normalizes API service payload with fallback properties
function normalizeService(s) {
  return {
    id: s.id || s.slug,
    slug: s.slug,
    name: s.name || s.title?.split('—')[0] || s.title,
    title: s.title,
    category: s.category,
    shortDescription: s.short_description || s.shortDescription,
    detailedDescription: s.description || s.detailedDescription || s.short_description,
    badge: s.badge || `Pillar 0${s.display_order || 1}`,
    iconName: s.icon_name || s.iconName || 'Activity',
    path: `/services/${s.slug}`,
    displayOrder: s.display_order || s.displayOrder || 1,
    image: s.image_url || s.image,
    offerings: Array.isArray(s.offerings) ? s.offerings : (s.offerings ? JSON.parse(s.offerings) : []),
    principle: s.principle || 'Rest is not a luxury; it is the biological foundation that makes vitality possible.',
    sampleDailyInsight: s.sampleDailyInsight || {
      timing: 'Daily Practice',
      practice: 'Cultivate intentional breath and awareness during key transitions.',
    },
  };
}

export default function Services() {
  const [services, setServices] = useState(servicesConfig);
  const [selectedSlug, setSelectedSlug] = useState(servicesConfig[0].slug);
  const [loading, setLoading] = useState(true);
  const [isFromApi, setIsFromApi] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchServices() {
      setLoading(true);
      const res = await servicesService.getAll();
      if (isMounted) {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map(normalizeService);
          setServices(normalized);
          setSelectedSlug(normalized[0].slug);
          setIsFromApi(true);
        } else {
          // Gracefully retain local configuration
          setServices(servicesConfig);
          setIsFromApi(false);
        }
        setLoading(false);
      }
    }
    fetchServices();
    return () => { isMounted = false; };
  }, []);

  const activeService = services.find((s) => s.slug === selectedSlug) || services[0];
  const ActiveIcon = iconMap[activeService.iconName] || Activity;

  return (
    <section id="services" className="py-20 md:py-28 bg-sand-50 relative overflow-hidden">
      <Container size="wide">
        {/* Section Header */}
        <SectionHeading
          overline="Core Disciplines"
          title="The Five Gateways of"
          titleAccent="Harmony"
          description="Each pillar operates as a standalone science, yet together they form an unshakeable foundation for human thriving. Select each pillar below to explore details."
          className="mb-12"
        />

        {/* Interactive Pillar Switcher Pills (All 5 Pillars) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 p-1.5 bg-sand rounded-full border border-beige max-w-4xl mx-auto shadow-soft">
          {services.map((service) => {
            const isSelected = service.slug === selectedSlug;
            const IconComponent = iconMap[service.iconName] || Activity;

            return (
              <button
                key={service.slug}
                type="button"
                onClick={() => setSelectedSlug(service.slug)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                  isSelected
                    ? 'bg-forest text-sand-light shadow-md'
                    : 'text-forest/80 hover:text-forest hover:bg-beige/40'
                }`}
                aria-pressed={isSelected}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-gold' : 'text-terracotta'}`} />
                <span>{service.name.split('—')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Service Detail Interactive Showcase */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeService.slug}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bg-sand rounded-2xl border border-beige p-6 sm:p-10 lg:p-12 shadow-elevated"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Narrative & Offerings (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-terracotta/10 text-terracotta uppercase tracking-wider">
                    {activeService.badge} &bull; {activeService.category}
                  </span>
                  {isFromApi && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live PostgreSQL
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-3xl sm:text-4xl text-forest font-normal leading-tight">
                  {activeService.name}: <span className="italic text-terracotta">{activeService.title}</span>
                </h3>

                <p className="text-base text-forest/80 leading-relaxed font-light">
                  {activeService.detailedDescription}
                </p>

                {/* Key Principle Callout */}
                <div className="p-4 rounded-xl bg-beige/40 border-l-4 border-terracotta my-6">
                  <span className="text-xs uppercase tracking-widest text-terracotta font-semibold block mb-1">
                    The Guiding Principle
                  </span>
                  <p className="font-serif italic text-base text-forest">
                    “{activeService.principle}”
                  </p>
                </div>

                {/* Offerings List */}
                {activeService.offerings && activeService.offerings.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs uppercase tracking-widest text-olive font-semibold">
                      Core Offerings &amp; Focus Areas:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeService.offerings.map((offering, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-forest/85">
                          <CheckCircle2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0 mt-0.5" />
                          <span>{offering}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-6 border-t border-beige/60 flex flex-wrap items-center gap-4">
                  <Button
                    to={activeService.path}
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                  >
                    Dedicated {activeService.name.split('—')[0].trim()} Sanctuary
                  </Button>

                  <Button
                    to="/#consultation"
                    variant="secondary"
                    size="md"
                  >
                    Schedule Consultation
                  </Button>
                </div>
              </div>

              {/* Right Column: Imagery & Daily Insight Card (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-[4/3] shadow-soft border border-beige">
                  <img
                    src={activeService.image}
                    alt={activeService.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Sample Daily Healing Cycle / Insight */}
                {activeService.sampleDailyInsight && (
                  <div className="p-5 rounded-xl bg-sand-light border border-beige shadow-soft space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-terracotta uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-terracotta" />
                      <span>{activeService.sampleDailyInsight.timing}</span>
                    </div>
                    <p className="text-xs text-forest/85 leading-relaxed font-light">
                      {activeService.sampleDailyInsight.practice}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* View All Services Catalog Link */}
        <div className="mt-12 text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-forest hover:text-terracotta transition-colors group"
          >
            <span>Explore Complete Services Directory</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
