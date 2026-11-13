import React from 'react';
import Hero from '../components/home/Hero';
import Philosophy from '../components/home/Philosophy';
import Services from '../components/home/Services';
import FounderSection from '../components/home/FounderSection';
import Testimonials from '../components/home/Testimonials';
import JournalSection from '../components/home/JournalSection';
import ConsultationCTA from '../components/home/ConsultationCTA';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Brand Philosophy */}
      <Philosophy />

      {/* 3. Five Wellness Pillars */}
      <Services />

      {/* 4. Founder Introduction: Rashmi */}
      <FounderSection />

      {/* 5. Client Testimonials (Graceful conditional render) */}
      <Testimonials />

      {/* 6. Knowledge Sanctuary / Journal */}
      <JournalSection />

      {/* 7. Consultation / Initiation CTA */}
      <ConsultationCTA />
    </div>
  );
}
