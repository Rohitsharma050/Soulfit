import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Compass, Heart } from 'lucide-react';
import Container from '../common/Container';
import Button from '../common/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-6 pb-20 md:pt-12 md:pb-28 bg-gradient-to-b from-forest/5 via-transparent to-transparent">
      {/* Subtle Organic Background Accents with Forest Green & Gold */}
      <div 
        className="absolute top-1/4 right-0 w-96 h-96 bg-forest/10 rounded-full blur-3xl pointer-events-none -z-10 transform translate-x-1/2" 
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-10 left-0 w-80 h-80 bg-gold/10 rounded-full blur-2xl pointer-events-none -z-10 transform -translate-x-1/3" 
        aria-hidden="true" 
      />

      <Container size="wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Typography & Narrative (Span 7) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Brand Header Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs tracking-[0.22em] uppercase font-bold shadow-soft mx-auto lg:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-forest" />
              <span>THE HARMONY PROJECT &bull; SOULFIT</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-normal text-forest leading-[1.08] tracking-tight">
              Where Ancient Wisdom Meets{' '}
              <span className="italic text-forest-light font-normal block sm:inline underline decoration-forest/30 decoration-wavy decoration-1 underline-offset-8">
                Conscious Living
              </span>
            </h1>

            {/* Supporting Brand Description */}
            <p className="text-base sm:text-lg md:text-xl text-forest/80 leading-relaxed font-light max-w-2xl mx-auto lg:mx-0">
              The Harmony Project is a complete wellness sanctuary integrating conscious physical vitality, elemental spatial alignment, cosmic understanding and cellular nourishment into one seamless path.
            </p>

            {/* Action Buttons with Prominent Forest Green CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                to="/#services"
                variant="primary"
                size="lg"
                icon={Compass}
                iconPosition="right"
                className="w-full sm:w-auto bg-forest hover:bg-forest-light text-sand-light shadow-elevated"
              >
                Explore 5 Pillars
              </Button>

              <Button
                to="/about"
                variant="secondary"
                size="lg"
                icon={Heart}
                iconPosition="left"
                className="w-full sm:w-auto border-forest/20 text-forest hover:bg-forest/5"
              >
                The Soulfit Journey
              </Button>
            </div>

            {/* Micro Highlights Grounded in Client Claims */}
            <div className="pt-6 border-t border-forest/15 grid grid-cols-3 gap-4 text-center lg:text-left max-w-lg mx-auto lg:mx-0">
              <div>
                <span className="block font-serif text-xl sm:text-2xl text-forest font-bold">5 Pillars</span>
                <span className="text-[11px] uppercase tracking-wider text-forest/70 font-medium">Unified Sanctuary</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl text-forest font-bold">10+ Years</span>
                <span className="text-[11px] uppercase tracking-wider text-forest/70 font-medium">Yoga Expertise</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl text-forest font-bold">Age 10+</span>
                <span className="text-[11px] uppercase tracking-wider text-forest/70 font-medium">Tailored Solutions</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Handcrafted Wellness Composition (Span 5) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Primary Image Frame with Organic Rounded Curves & Forest Green Border */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-elevated border-2 border-forest/20 bg-sand-light aspect-[4/5]">
                <img
                  src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1000&q=80"
                  alt="Restorative yoga and conscious living at Soulfit"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                
                {/* Forest Green Gradient Wash */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/20 to-transparent pointer-events-none" />

                {/* Floating Bottom Quote Over Image */}
                <div className="absolute bottom-6 left-6 right-6 text-sand-light">
                  <p className="font-serif italic text-base sm:text-lg leading-snug text-sand">
                    “Rest isn’t a luxury or a reward. It is part of being healthy, and it is what makes everything else possible.”
                  </p>
                  <span className="text-[11px] uppercase tracking-widest text-gold font-medium block mt-1.5">
                    &mdash; The Soulfit Philosophy
                  </span>
                </div>
              </div>

              {/* Secondary Floating Offset Accent Card */}
              <div className="absolute -bottom-6 -left-6 z-20 bg-sand-50 p-4 rounded-xl border border-forest/15 shadow-elevated hidden sm:block max-w-[220px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                  <span className="text-[10px] font-sans uppercase tracking-widest text-forest font-bold">
                    Restorative Care
                  </span>
                </div>
                <p className="text-xs text-forest/90 font-serif leading-snug">
                  Rest, calm and energy for everyday life, at home or at work.
                </p>
              </div>

              {/* Decorative Subtle Forest Frame Border Accent */}
              <div 
                className="absolute -top-4 -right-4 w-full h-full rounded-2xl border-2 border-forest/20 -z-10 pointer-events-none hidden sm:block" 
                aria-hidden="true" 
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
