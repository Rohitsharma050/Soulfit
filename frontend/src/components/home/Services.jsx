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
  const fallback = servicesConfig.find((fc) => fc.slug === s.slug) || {};
  return {
    id: s.id || s.slug,
    slug: s.slug,
    name: fallback.name || s.title,
    title: s.title || fallback.title,
    category: s.category || fallback.category,
    shortDescription: s.short_description || s.shortDescription || fallback.shortDescription,
    detailedDescription: s.description || s.detailedDescription || fallback.detailedDescription,
    badge: s.badge || `Pillar 0${s.display_order || fallback.displayOrder || 1}`,
    iconName: s.icon_name || fallback.iconName || 'Activity',
    path: `/services/${s.slug}`,
    displayOrder: s.display_order || fallback.displayOrder || 1,
    image: s.image_url || fallback.image,
    offerings: Array.isArray(s.offerings) ? s.offerings : (s.offerings ? JSON.parse(s.offerings) : fallback.offerings || []),
    principle: fallback.principle || "Rest isn't a luxury or a reward; it is what makes everything else possible.",
    sampleDailyInsight: fallback.sampleDailyInsight || {
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
    <section id="services" className="py-20 md:py-28 bg-sand-50 relative overflow-hidden border-b border-forest/10">
      <Container size="wide">
        {/* Section Header */}
        <SectionHeading
          overline="Core Disciplines"
          title="The Five Gateways of"
          titleAccent="Harmony"
          description="Each pillar operates as a standalone discipline, yet together they form an unshakeable foundation for human thriving. Select each pillar below to explore details."
          className="mb-12"
        />

        {/* Interactive Pillar Switcher Pills (All 5 Pillars) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 p-2 bg-sand rounded-full border border-forest/15 max-w-4xl mx-auto shadow-soft">
          {services.map((service) => {
            const isSelected = service.slug === selectedSlug;
            const IconComponent = iconMap[service.iconName] || Activity;

            return (
              <button
                key={service.slug}
                type="button"
                onClick={() => setSelectedSlug(service.slug)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${
                  isSelected
                    ? 'bg-forest text-sand-light shadow-md font-semibold'
                    : 'text-forest/80 hover:text-forest hover:bg-forest/5'
                }`}
                aria-pressed={isSelected}
              >
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-gold' : 'text-forest'}`} />
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
            className="bg-sand rounded-2xl border-2 border-forest/15 p-6 sm:p-10 lg:p-12 shadow-elevated"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Narrative & Offerings (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-forest/10 text-forest uppercase tracking-wider border border-forest/15">
                    {activeService.badge} &bull; {activeService.category}
                  </span>
                  {isFromApi && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-mono border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live PostgreSQL
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-3xl sm:text-4xl text-forest font-normal leading-tight">
                  {activeService.name}: <span className="italic text-forest-light">{activeService.title}</span>
                </h3>

                <p className="text-base text-forest/80 leading-relaxed font-light">
                  {activeService.detailedDescription}
                </p>

                {/* Key Principle Callout in Forest Green */}
                <div className="p-5 rounded-xl bg-forest text-sand-light border-l-4 border-gold my-6 shadow-soft">
                  <span className="text-xs uppercase tracking-widest text-gold font-semibold block mb-1">
                    The Guiding Principle
                  </span>
                  <p className="font-serif italic text-base sm:text-lg text-sand">
                    “{activeService.principle}”
                  </p>
                </div>

                {/* Offerings List */}
                {activeService.offerings && activeService.offerings.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs uppercase tracking-widest text-forest font-bold">
                      Core Offerings &amp; Focus Areas:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeService.offerings.map((offering, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-forest/85">
                          <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0 mt-0.5" />
                          <span>{offering}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-6 border-t border-forest/15 flex flex-wrap items-center gap-4">
                  <Button
                    to={activeService.path}
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                    className="bg-forest hover:bg-forest-light text-sand-light"
                  >
                    Dedicated {activeService.name.split('—')[0].trim()} Sanctuary
                  </Button>

                  <Button
                    to="/#consultation"
                    variant="secondary"
                    size="md"
                    className="border-forest/20 text-forest hover:bg-forest/5"
                  >
                    Schedule Consultation
                  </Button>
                </div>
              </div>

              {/* Right Column: Imagery & Daily Insight Card (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-[4/3] shadow-soft border-2 border-forest/20">
                  <img
                    src={activeService.image}
                    alt={activeService.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Sample Daily Healing Cycle / Insight */}
                {activeService.sampleDailyInsight && (
                  <div className="p-5 rounded-xl bg-sand-light border border-forest/15 shadow-soft space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-forest uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-forest" />
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
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-forest hover:text-forest-light transition-colors group"
          >
            <span>Explore Complete Services Directory</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
