import React from 'react';
import { Eye, Target, Calendar, Sparkles } from 'lucide-react';
import Container from '../common/Container';
import Button from '../common/Button';

export default function FounderSection() {
  return (
    <section id="founder" className="py-20 md:py-28 bg-sand border-b border-beige/60 relative overflow-hidden">
      <Container size="wide">
        {/* Section Overline & Title */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs uppercase tracking-[0.22em] text-terracotta font-semibold block mb-2">
            Leadership &amp; Vision
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-forest font-normal leading-tight">
            Guided by Rashmi’s <span className="italic text-terracotta">Integrated Worldview</span>
          </h2>
          <p className="text-base sm:text-lg text-olive leading-relaxed font-light mt-4">
            For years, health was compartmentalized—you exercised at a gym, visited an astrologer during crises, redesigned a house blindly, or dieted with punishment. Rashmi founded The Harmony Project to bridge these fractured disciplines into one unified life philosophy.
          </p>
        </div>

        {/* Founder Story Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Founder Medallion Card (Span 4) */}
          <div className="lg:col-span-4 bg-sand-50 rounded-2xl border border-beige p-8 shadow-soft text-center relative">
            {/* Elegant Emblem */}
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-sand border-2 border-beige mb-4 shadow-soft">
              <svg 
                viewBox="0 0 100 100" 
                className="w-14 h-14 text-forest" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                {/* Sacred Lotus Blossom Motif */}
                <circle cx="50" cy="50" r="10" fill="#65745B" opacity="0.3" />
                <path d="M50 20 C42 36, 42 44, 50 50 C58 44, 58 36, 50 20 Z" fill="#C87D55" opacity="0.85" />
                <path d="M50 80 C42 64, 42 56, 50 50 C58 56, 58 64, 50 80 Z" fill="#C87D55" opacity="0.85" />
                <path d="M20 50 C36 42, 44 42, 50 50 C44 58, 36 58, 20 50 Z" fill="#65745B" opacity="0.85" />
                <path d="M80 50 C64 42, 56 42, 50 50 C56 58, 64 58, 80 50 Z" fill="#65745B" opacity="0.85" />
                <circle cx="50" cy="50" r="6" fill="#1E2C24" />
              </svg>
            </div>

            <div className="mb-2">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-semibold bg-terracotta text-warmWhite">
                Founder
              </span>
            </div>

            <h3 className="font-serif text-3xl text-forest font-medium mt-2 mb-1">
              Rashmi
            </h3>
            <p className="text-xs uppercase tracking-widest text-olive font-semibold mb-6">
              Holistic Wellness Mentor &amp; Architect of Balance
            </p>

            <blockquote className="border-t border-beige/80 pt-4 text-xs font-serif italic text-forest/80 leading-relaxed">
              “Healing is an unbroken circle of Self, Space, and Fuel.”
            </blockquote>
          </div>

          {/* Right Column: Vision & Mission Dual Framework (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Her Vision Card */}
              <div className="bg-sand-50 rounded-2xl border border-beige p-6 sm:p-8 shadow-soft space-y-3">
                <div className="w-10 h-10 rounded-brand bg-olive/10 text-olive flex items-center justify-center">
                  <Eye className="w-5 h-5 text-olive" />
                </div>
                <h4 className="font-serif text-2xl text-forest font-medium">
                  Her Vision
                </h4>
                <p className="text-xs sm:text-sm text-forest/80 font-light leading-relaxed">
                  To create a global community where every human being exists in conscious sync with their internal biological vessel, living environment, and natural rhythms.
                </p>
              </div>

              {/* Her Mission Card */}
              <div className="bg-sand-50 rounded-2xl border border-beige p-6 sm:p-8 shadow-soft space-y-3">
                <div className="w-10 h-10 rounded-brand bg-terracotta/10 text-terracotta flex items-center justify-center">
                  <Target className="w-5 h-5 text-terracotta" />
                </div>
                <h4 className="font-serif text-2xl text-forest font-medium">
                  Her Mission
                </h4>
                <p className="text-xs sm:text-sm text-forest/80 font-light leading-relaxed">
                  To provide authentic, actionable frameworks through Soulfit physical mastery, astrological clarity, non-invasive spatial Vastu harmonizing, and functional nutritional wisdom.
                </p>
              </div>
            </div>

            {/* Leadership Message Excerpt & CTA */}
            <div className="bg-beige/30 rounded-2xl border border-beige p-6 sm:p-8 space-y-4">
              <h4 className="text-xs uppercase tracking-widest text-olive font-semibold">
                A Message from Leadership
              </h4>
              <p className="font-serif text-lg text-forest italic leading-relaxed">
                “We believe wellness should not feel like another stressful responsibility on your to-do list. It should become a natural, enjoyable rhythm of everyday living.”
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Button
                  to="/#consultation"
                  variant="primary"
                  size="md"
                  icon={Calendar}
                  iconPosition="right"
                >
                  Schedule 1-on-1 with Rashmi
                </Button>

                <Button
                  to="/about"
                  variant="secondary"
                  size="md"
                >
                  Read Full Biography &amp; Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
