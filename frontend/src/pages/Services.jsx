import React from 'react';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import ServiceCard from '../components/common/ServiceCard';
import ConsultationCTA from '../components/home/ConsultationCTA';
import { servicesConfig } from '../config/servicesConfig';

export default function Services() {
  return (
    <div className="py-16 md:py-24 space-y-20">
      <Container size="wide">
        <SectionHeading
          overline="Holistic Offerings"
          title="The Five Pillars of"
          titleAccent="Sanctuary Living"
          description="Explore our complete suite of individualized services spanning physical movement, spatial geometry, cosmic understanding, cellular nourishment, and organizational health."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesConfig.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              featured={index === 0}
            />
          ))}
        </div>
      </Container>

      <ConsultationCTA />
    </div>
  );
}
