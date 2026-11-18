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
          const normalized = res.data.map((s, idx) => {
            const fallback = servicesConfig.find((fc) => fc.slug === s.slug) || {};
            return {
              id: s.id || s.slug,
              slug: s.slug,
              name: fallback.name || s.title,
              title: s.title || fallback.title,
              category: s.category || fallback.category,
              shortDescription: s.short_description || s.shortDescription || fallback.shortDescription,
              detailedDescription: s.description || s.detailedDescription || fallback.detailedDescription,
              badge: `Pillar 0${s.display_order || idx + 1}`,
              iconName: s.icon_name || fallback.iconName || 'Activity',
              path: `/services/${s.slug}`,
              displayOrder: s.display_order || idx + 1,
              image: s.image_url || fallback.image,
              offerings: Array.isArray(s.offerings) ? s.offerings : (s.offerings ? JSON.parse(s.offerings) : fallback.offerings || []),
            };
          });
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
    <div className="py-16 md:py-24 space-y-20 bg-sand">
      <Container size="wide">
        <SectionHeading
          overline="Five Gateways of Harmony"
          title="The Five Pillars of"
          titleAccent="Sanctuary Living"
          description="Explore our complete suite of individualized services spanning restorative yoga, spatial geometry, cosmic understanding, cellular nourishment, and organizational health."
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
