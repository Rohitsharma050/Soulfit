import React from 'react';
import Hero from '../components/home/Hero';
import IntroSection from '../components/home/IntroSection';
import Philosophy from '../components/home/Philosophy';
import Services from '../components/home/Services';
import LeadershipSection from '../components/home/LeadershipSection';
import Testimonials from '../components/home/Testimonials';
import JournalSection from '../components/home/JournalSection';
import ConsultationCTA from '../components/home/ConsultationCTA';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Sneak Peek in Busy Life & Restorative Introduction */}
      <IntroSection />

      {/* 3. Breathe, Relax and Be Still / Balance Your Life */}
      <Philosophy />

      {/* 4. Five Wellness Pillars */}
      <Services />

      {/* 5. A Message from the Leadership */}
      <LeadershipSection />

      {/* 6. Client Testimonials (Graceful conditional render) */}
      <Testimonials />

      {/* 7. Knowledge Sanctuary / Journal Dispatches */}
      <JournalSection />

      {/* 8. Consultation / Initiation CTA */}
      <ConsultationCTA />
    </div>
  );
}
