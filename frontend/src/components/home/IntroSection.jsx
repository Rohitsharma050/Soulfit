import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, HeartPulse, Sparkles, ArrowRight, Wind } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Button from '../common/Button';

export default function IntroSection() {
  return (
    <section id="introduction" className="py-20 md:py-28 bg-sand border-b border-forest/10 relative overflow-hidden">
      {/* Subtle Forest Accent Ambient Background */}
      <div 
        className="absolute top-0 right-1/4 w-80 h-80 bg-forest/5 rounded-full blur-3xl pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      <Container size="wide">
        {/* Section Heading */}
        <SectionHeading
          overline="Breathe, Relax and Be Still"
          title="Bridging the Demands of Daily Life with"
          titleAccent="Restorative Health"
          description="We know the importance of nutrition and fitness, yet find it hard to take time for ourselves. Soulfit bridges this gap with tailored yoga programs designed for your unique health needs."
          className="mb-16"
        />

        {/* Editorial Narrative Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-16">
          {/* Left Column: Visual Storytelling Frame (Span 5) */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-elevated border-2 border-forest/20 aspect-[4/5] bg-forest">
              <img
                src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80"
                alt="Mindful pause and breathing practice"
                className="w-full h-full object-cover opacity-90"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/30 to-transparent pointer-events-none" />

              {/* Inset Quote Overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-sand-light p-5 rounded-xl bg-forest/80 backdrop-blur-sm border border-forest-light/40">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-sans uppercase tracking-widest text-gold font-semibold">
                    The Restorative Truth
                  </span>
                </div>
                <p className="font-serif italic text-sm sm:text-base text-sand leading-snug">
                  “We think taking out time for ourselves is being selfish, but we forget our bodies fundamentally need rest.”
                </p>
              </div>
            </div>

            {/* Subtle decorative offset border in forest green */}
            <div 
              className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl border-2 border-forest/20 -z-10 pointer-events-none hidden sm:block" 
              aria-hidden="true" 
            />
          </div>

          {/* Right Column: Client's Supplied Narrative (Span 7) */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-forest" />
              <span>A Sneak Peek into Our Busy Days</span>
            </div>

            <h3 className="font-serif text-3xl sm:text-4xl text-forest font-normal leading-snug">
              Juggling Deadlines, Screens and Never-Ending Responsibilities
            </h3>

            <div className="space-y-4 text-forest/85 text-base sm:text-lg leading-relaxed font-light">
              <p>
                All of us are juggling deadlines, commutes, screens, family responsibilities, and a never-ending to-do list. We are all busy proving ourselves in our personal as well as professional lives. We know the importance of proper nutrition and fitness, but still find it hard to make time for ourselves.
              </p>

              <p>
                The real difficulty is that after a long day of work and stress, many of us are simply too tired to listen to our inner voice. Our bodies ache, our minds are full, and recovery becomes the hardest part of the routine.
              </p>

              <div className="p-5 rounded-xl bg-forest text-sand-light shadow-soft my-4 border border-forest-dark">
                <p className="font-serif italic text-base sm:text-lg text-sand leading-relaxed">
                  We often think taking time for ourselves is being selfish, but we forget our bodies also need rest.
                </p>
              </div>

              <p>
                We understand that every individual has unique health needs&mdash;this is the exact gap <span className="font-semibold text-forest">Soulfit</span> bridges. Soulfit caters to those needs with tailored yoga programs designed to help you achieve your personal health goals.
              </p>
            </div>

            {/* Quick Benefits Grid */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-forest/15">
              <div className="p-3.5 rounded-brand bg-sand-50 border border-forest/10">
                <Clock className="w-4 h-4 text-forest mb-2" />
                <h4 className="font-serif text-base text-forest font-semibold">Practical Pacing</h4>
                <p className="text-xs text-forest/70 font-light mt-1">Starts with mindful breaths and gentle pauses.</p>
              </div>

              <div className="p-3.5 rounded-brand bg-sand-50 border border-forest/10">
                <HeartPulse className="w-4 h-4 text-forest mb-2" />
                <h4 className="font-serif text-base text-forest font-semibold">Condition Care</h4>
                <p className="text-xs text-forest/70 font-light mt-1">Specialized for PCOD, Hypertension &amp; Diabetes.</p>
              </div>

              <div className="p-3.5 rounded-brand bg-sand-50 border border-forest/10">
                <ShieldCheck className="w-4 h-4 text-forest mb-2" />
                <h4 className="font-serif text-base text-forest font-semibold">For All Ages 10+</h4>
                <p className="text-xs text-forest/70 font-light mt-1">Tailored guidance regardless of age or gender.</p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                to="/about"
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                className="bg-forest hover:bg-forest-light text-sand-light"
              >
                Read The Soulfit Philosophy
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
