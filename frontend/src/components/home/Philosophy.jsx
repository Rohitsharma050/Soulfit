import React from 'react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import { Activity, Compass, Moon, Building2, Apple, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Philosophy() {
  const pillars = [
    {
      name: 'Soulfit & Somatic Vitality',
      role: 'The Biological Vessel',
      description: 'Physical strength and restorative yoga allowing your nervous system to exit perpetual fight-or-flight.',
      icon: Activity,
      color: 'text-forest',
    },
    {
      name: 'Vastu Spatial Geometry',
      role: 'The Outer Sanctuary',
      description: 'Aligning living and working spaces with elemental directions so your home recharges rather than depletes.',
      icon: Compass,
      color: 'text-olive',
    },
    {
      name: 'Astrological Clarity',
      role: 'The Cosmic Rhythm',
      description: 'Recognizing planetary transit cycles to act with conscious timing rather than frantic struggle.',
      icon: Moon,
      color: 'text-terracotta',
    },
    {
      name: 'Food as Medicine',
      role: 'Cellular Bio-Fuel',
      description: 'Anti-inflammatory seasonal nourishment and Ritucharya that clears systemic inflammation and gut distress.',
      icon: Apple,
      color: 'text-forest',
    },
    {
      name: 'Corporate Wellbeing',
      role: 'Organizational Harmony',
      description: 'Cultivating workplace environments where teams sustain high performance without chronic burnout.',
      icon: Building2,
      color: 'text-olive',
    },
  ];

  return (
    <section id="philosophy" className="py-20 md:py-28 bg-sand border-y border-beige/60 relative overflow-hidden">
      <Container size="wide">
        {/* Section Header */}
        <SectionHeading
          overline="The Unbroken Circle"
          title="One philosophy. Five paths to"
          titleAccent="balance."
          description="True wellbeing is not found in isolated habits. When physical movement, spatial geometry, cosmic awareness, cellular nutrition, and work rhythms harmonize, natural vitality emerges effortlessly."
          className="mb-16"
        />

        {/* Core Narrative Quote Banner */}
        <div className="max-w-4xl mx-auto bg-sand-50 rounded-2xl border border-beige p-8 md:p-12 mb-16 shadow-soft text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-forest text-gold flex items-center justify-center font-serif text-lg">
            ✦
          </div>

          <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-forest font-normal leading-relaxed mb-4">
            “Healing is an unbroken circle of Self, Space, and Fuel.”
          </p>
          <p className="text-xs uppercase tracking-widest text-terracotta font-semibold">
            &mdash; The Harmony Project Foundational Premise
          </p>

          <p className="mt-6 text-sm text-olive max-w-2xl mx-auto font-light leading-relaxed">
            For years, health was compartmentalized—you exercised at a gym, visited an astrologer during crises, redesigned a house blindly, or dieted with punishment. The Harmony Project unites these disciplines into a singular, sustainable way of life.
          </p>
        </div>

        {/* 5 Pathways Interconnected Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className={`bg-sand-50 rounded-2xl border border-beige/80 p-8 transition-all duration-normal hover:shadow-elevated hover:border-olive/30 flex flex-col justify-between ${
                  index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-brand bg-sand border border-beige flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-[10px] font-mono text-olive/60 uppercase">0{index + 1} // Circle</span>
                  </div>

                  <span className="text-xs font-semibold text-terracotta uppercase tracking-wider block mb-1">
                    {item.role}
                  </span>
                  <h3 className="font-serif text-2xl text-forest font-normal mb-3">
                    {item.name}
                  </h3>
                  <p className="text-sm text-forest/75 font-light leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-beige/40 flex items-center justify-between text-xs">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-1 font-medium text-forest hover:text-terracotta transition-colors"
                  >
                    <span>View Integration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Interactive Integrative Callout Card */}
          <div className="bg-forest text-sand-light rounded-2xl p-8 flex flex-col justify-between shadow-soft border border-forest-dark md:col-span-2 lg:col-span-1">
            <div>
              <span className="text-xs font-semibold text-gold uppercase tracking-widest block mb-2">
                Personalized Blueprint
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-sand font-normal mb-4">
                How Do Your Five Pillars Connect?
              </h3>
              <p className="text-sm text-sand/80 font-light leading-relaxed mb-6">
                Your journey starts with a holistic assessment mapping where physical fatigue, living space resistance, or dietary inflammation are blocking your vitality.
              </p>
            </div>

            <div className="pt-4 border-t border-warmWhite/15">
              <Link
                to="/#consultation"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold font-semibold hover:text-gold-light transition-colors"
              >
                <span>Request Comprehensive Mapping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
