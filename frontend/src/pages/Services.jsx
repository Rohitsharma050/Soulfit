import React, { useState, useEffect } from 'react';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import ServiceCard from '../components/common/ServiceCard';
import ConsultationCTA from '../components/home/ConsultationCTA';
import { servicesConfig } from '../config/servicesConfig';
import { servicesService } from '../services/api';

export default function Services() {
  const [services, setServices] = useState(servicesConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadServices() {
      const res = await servicesService.getAll();
      if (isMounted) {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((s, idx) => ({
            id: s.id || s.slug,
            slug: s.slug,
            name: s.title,
            title: s.category || s.title,
            category: s.category,
            shortDescription: s.short_description || s.shortDescription,
            detailedDescription: s.description || s.detailedDescription,
            badge: `Pillar 0${s.display_order || idx + 1}`,
            iconName: s.icon_name || 'Activity',
            path: `/services/${s.slug}`,
            displayOrder: s.display_order || idx + 1,
            image: s.image_url,
            offerings: Array.isArray(s.offerings) ? s.offerings : (s.offerings ? JSON.parse(s.offerings) : []),
          }));
          setServices(normalized);
        } else {
          setServices(servicesConfig);
        }
        setLoading(false);
      }
    }
    loadServices();
    return () => { isMounted = false; };
  }, []);

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
          {services.map((service, index) => (
            <ServiceCard
              key={service.slug || service.id}
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
