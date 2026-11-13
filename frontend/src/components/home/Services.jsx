import React, { useState } from 'react';
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
  ArrowUpRight
} from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';
import { servicesConfig } from '../../config/servicesConfig';

const iconMap = {
  Activity,
  Compass,
  Moon,
  Building2,
  Apple,
};

export default function Services() {
  const [selectedServiceId, setSelectedServiceId] = useState(servicesConfig[0].id);

  const activeService = servicesConfig.find((s) => s.id === selectedServiceId) || servicesConfig[0];
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
          {servicesConfig.map((service) => {
            const isSelected = service.id === selectedServiceId;
            const IconComponent = iconMap[service.iconName] || Activity;

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedServiceId(service.id)}
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
            key={activeService.id}
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
