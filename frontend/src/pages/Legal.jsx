import React from 'react';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';

export default function Legal({ type = 'privacy' }) {
  const contentMap = {
    privacy: {
      overline: 'Client Trust & Safety',
      title: 'Privacy Policy',
      accent: '& Data Ethics',
      sections: [
        {
          heading: 'Personal & Health Information',
          text: 'The Harmony Project and Soulfit treat all personal health observations, consultation records, birth chart coordinates, and residential blueprints with strict confidentiality. Your data is never sold, shared, or leveraged for commercial advertising.',
        },
        {
          heading: 'Digital Communications',
          text: 'When you subscribe to our Cosmic & Wellness Digest, your email is stored securely solely for sending weekly wellness reflections and scheduling updates. You may opt out or request data removal at any time.',
        },
        {
          heading: 'Consultation Records',
          text: 'Observations shared during 1-on-1 sessions with Rashmi or certified Soulfit instructors remain private and are referenced only to support your ongoing holistic wellness journey.',
        },
      ],
    },
    terms: {
      overline: 'Service Boundaries',
      title: 'Terms of Service',
      accent: '& Practice Scope',
      sections: [
        {
          heading: 'Holistic Guidance Disclaimer',
          text: 'The practices offered by The Harmony Project—including restorative yoga, Vastu spatial geometry, astrological reflection, and dietary bio-fuel frameworks—are designed for holistic lifestyle optimization. They are not intended as emergency medical diagnosis or treatment.',
        },
        {
          heading: 'Personal Responsibility',
          text: 'Individuals with pre-existing physical or medical conditions are encouraged to practice mindful self-awareness and consult their primary healthcare physician when undertaking new fitness routines or dietary adjustments.',
        },
      ],
    },
    ethics: {
      overline: 'Holistic Integrity',
      title: 'Ethics in',
      accent: 'Guidance',
      sections: [
        {
          heading: 'Non-Invasive Principles',
          text: 'We reject fear-based astrological predictions or destructive Vastu advice. Our spatial and cosmic guidance is strictly constructive, respectful, non-invasive, and oriented toward inner empowerment.',
        },
        {
          heading: 'Restorative Respect',
          text: 'Every body operates with its own seasonal capacity. We respect individual pacing and never enforce extreme physical demands or punitive restrictions.',
        },
      ],
    },
  };

  const current = contentMap[type] || contentMap.privacy;

  return (
    <div className="py-16 md:py-24">
      <Container size="narrow">
        <SectionHeading
          overline={current.overline}
          title={current.title}
          titleAccent={current.accent}
          className="mb-12"
        />

        <div className="bg-sand-50 rounded-2xl border border-beige p-8 sm:p-12 shadow-soft space-y-8 text-forest/80">
          {current.sections.map((s, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="font-serif text-2xl text-forest font-medium">{s.heading}</h3>
              <p className="text-sm font-light leading-relaxed">{s.text}</p>
            </div>
          ))}
          <p className="text-xs text-olive font-mono pt-4 border-t border-beige/60">
            Last updated: November 2026 &bull; The Harmony Project Legal &amp; Ethics Standards
          </p>
        </div>
      </Container>
    </div>
  );
}
