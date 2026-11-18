import React from 'react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import { Activity, Compass, Moon, Building2, Apple, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Philosophy() {
  const pillars = [
    {
      name: 'Soulfit Restorative Yoga',
      role: 'Physical Vitality & Restoration',
      description: 'Restorative yoga, rest, calm, and energy for everyday life, with tailored programs for condition management and all age groups.',
      icon: Activity,
      color: 'text-forest',
    },
    {
      name: 'Vastu Spatial Geometry',
      role: 'Spatial Harmony & Alignment',
      description: 'Aligning living and working spaces with natural directional energies and the five elements to cultivate mental clarity and peaceful living.',
      icon: Compass,
      color: 'text-forest',
    },
    {
      name: 'Astrological Clarity',
      role: 'Cosmic Blueprint & Timing',
      description: 'Understanding planetary transits and energetic cycles to act with conscious timing and clarity rather than frantic struggle.',
      icon: Moon,
      color: 'text-forest',
    },
    {
      name: 'Food as Medicine',
      role: 'Cellular Nourishment & Bio-Fuel',
      description: 'Nutritional wisdom grounded in whole foods and Ayurvedic seasonal rhythms (Ritucharya) that support sustained vitality.',
      icon: Apple,
      color: 'text-forest',
    },
    {
      name: 'Corporate Wellbeing',
      role: 'Workplace Restorative Workshops',
      description: 'Cultivating workplace environments where teams sustain high performance without chronic burnout through mindful recovery.',
      icon: Building2,
      color: 'text-forest',
    },
  ];

  return (
    <section id="philosophy" className="py-20 md:py-28 bg-sand border-y border-forest/10 relative overflow-hidden">
      <Container size="wide">
        {/* Section Header */}
        <SectionHeading
          overline="Breathe, Relax and Be Still"
          title="Balance Your Life Through"
          titleAccent="Restorative Harmony"
          description="True wellness is not about pushing harder; it is about slowing down, listening to your body, and allowing yourself the time to recover."
          className="mb-16"
        />

        {/* Core Narrative Quote Banner with Forest Green Accent */}
        <div className="max-w-4xl mx-auto bg-forest text-sand-light rounded-2xl border border-forest-dark p-8 md:p-12 mb-16 shadow-elevated text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gold text-forest flex items-center justify-center font-serif text-lg font-bold">
            ✦
          </div>

          <p className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-sand font-normal leading-relaxed mb-4">
            “Rest isn’t a luxury or a reward at the end of the week. It is part of being healthy, and it is what makes everything else possible.”
          </p>
          <p className="text-xs uppercase tracking-[0.22em] text-gold font-semibold">
            &mdash; The Soulfit Foundational Principle
          </p>

          <p className="mt-6 text-sm text-sand/80 max-w-2xl mx-auto font-light leading-relaxed">
            The real change comes when yoga slowly becomes a way of life. It doesn't have to be dramatic or time-consuming. It can start with a few mindful breaths between meetings, a gentle stretch before bed, a slower meal, or one restorative session a week.
          </p>
        </div>

        {/* 5 Pathways Interconnected Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className={`bg-sand-50 rounded-2xl border border-forest/10 p-8 transition-all duration-normal hover:shadow-elevated hover:border-forest/30 flex flex-col justify-between ${
                  index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-brand bg-forest/10 border border-forest/20 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="text-[10px] font-mono text-forest/60 uppercase">0{index + 1} // Discipline</span>
                  </div>

                  <span className="text-xs font-semibold text-forest uppercase tracking-wider block mb-1">
                    {item.role}
                  </span>
                  <h3 className="font-serif text-2xl text-forest font-normal mb-3">
                    {item.name}
                  </h3>
                  <p className="text-sm text-forest/75 font-light leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-forest/10 flex items-center justify-between text-xs">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-1 font-semibold text-forest hover:text-forest-light transition-colors"
                  >
                    <span>Explore Pillar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Interactive Integrative Callout Card in Rich Forest Green */}
          <div className="bg-forest text-sand-light rounded-2xl p-8 flex flex-col justify-between shadow-soft border border-forest-dark md:col-span-2 lg:col-span-1">
            <div>
              <span className="text-xs font-semibold text-gold uppercase tracking-widest block mb-2">
                Personalized Care
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-sand font-normal mb-4">
                Tailored for Your Unique Health Needs
              </h3>
              <p className="text-sm text-sand/80 font-light leading-relaxed mb-6">
                From weight balance and condition care (PCOD, Hypertension, Diabetes) to prenatal and fertility yoga, we create customized programs for every stage of life.
              </p>
            </div>

            <div className="pt-4 border-t border-warmWhite/15">
              <Link
                to="/#consultation"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold font-semibold hover:text-gold-light transition-colors"
              >
                <span>Request Tailored Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
