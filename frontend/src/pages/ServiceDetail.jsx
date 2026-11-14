import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import ConsultationCTA from '../components/home/ConsultationCTA';
import { servicesConfig } from '../config/servicesConfig';
import { servicesService } from '../services/api';
import { CheckCircle2, ArrowRight, ArrowLeft, Clock } from 'lucide-react';

export default function ServiceDetail({ forcedSlug }) {
  const { slug } = useParams();
  const currentSlug = forcedSlug || slug;

  const localFallback = servicesConfig.find(
    (s) => s.slug === currentSlug || s.id === currentSlug
  );

  const [service, setService] = useState(localFallback);

  useEffect(() => {
    let isMounted = true;
    async function loadService() {
      if (currentSlug) {
        const res = await servicesService.getBySlug(currentSlug);
        if (isMounted && res.success && res.data) {
          const s = res.data;
          setService({
            id: s.id,
            slug: s.slug,
            name: s.title?.split('—')[0] || s.title,
            title: s.title,
            category: s.category,
            detailedDescription: s.description || s.short_description,
            shortDescription: s.short_description,
            badge: `Pillar 0${s.display_order || 1}`,
            image: s.image_url || localFallback?.image,
            offerings: Array.isArray(s.offerings) ? s.offerings : (s.offerings ? JSON.parse(s.offerings) : localFallback?.offerings || []),
            principle: localFallback?.principle || 'Rest is an unbroken circle of self, space, and conscious fuel.',
            sampleDailyInsight: localFallback?.sampleDailyInsight,
          });
        }
      }
    }
    loadService();
    return () => { isMounted = false; };
  }, [currentSlug]);

  if (!service && !localFallback) {
    return <Navigate to="/services" replace />;
  }

  const currentService = service || localFallback;
  const otherServices = servicesConfig.filter((s) => s.slug !== currentSlug && s.id !== currentSlug);

  return (
    <div className="py-12 md:py-20 space-y-16">
      <Container size="default">
        {/* Breadcrumb / Back Link */}
        <div className="mb-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-olive hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Five Pillars</span>
          </Link>
        </div>

        {/* Hero Section of the Service */}
        <div className="space-y-6 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-terracotta/10 text-terracotta uppercase tracking-wider">
            {currentService.badge} &bull; {currentService.category}
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-forest font-normal leading-tight">
            {currentService.name}
          </h1>

          <p className="text-xl font-serif italic text-terracotta">
            {currentService.title}
          </p>

          <p className="text-base sm:text-lg text-olive font-light leading-relaxed">
            {currentService.detailedDescription}
          </p>
        </div>

        {/* Feature Image Banner */}
        <div className="my-10 rounded-2xl overflow-hidden aspect-[16/9] shadow-elevated border border-beige bg-sand-50">
          <img
            src={currentService.image}
            alt={currentService.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Guiding Principle Callout */}
        {currentService.principle && (
          <div className="p-8 rounded-2xl bg-sand-50 border border-beige shadow-soft my-10">
            <span className="text-xs uppercase tracking-widest text-terracotta font-semibold block mb-2">
              Sanctuary Core Principle
            </span>
            <blockquote className="font-serif italic text-2xl text-forest leading-relaxed">
              “{currentService.principle}”
            </blockquote>
          </div>
        )}

        {/* Offerings and Focus Areas Grid */}
        {currentService.offerings && currentService.offerings.length > 0 && (
          <div className="space-y-6 pt-6">
            <h2 className="font-serif text-3xl text-forest font-normal">
              What We Address &amp; Guide:
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {currentService.offerings.map((offering, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-sand-50 border border-beige flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-forest/90 font-light">{offering}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Healing Cycle if available */}
        {currentService.sampleDailyInsight && (
          <div className="p-6 rounded-2xl bg-beige/40 border border-beige-dark mt-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-terracotta uppercase tracking-wider">
              <Clock className="w-4 h-4 text-terracotta" />
              <span>{currentService.sampleDailyInsight.timing}</span>
            </div>
            <p className="text-sm text-forest/85 leading-relaxed font-light">
              {currentService.sampleDailyInsight.practice}
            </p>
          </div>
        )}

        {/* Other Pillars Carousel / Mini Grid */}
        <div className="pt-16 border-t border-beige/60 space-y-6">
          <h3 className="font-serif text-2xl text-forest font-normal">
            Explore Interconnected Pillars
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherServices.map((other) => (
              <Link
                key={other.id || other.slug}
                to={other.path}
                className="p-4 rounded-xl bg-sand-50 border border-beige hover:border-terracotta/40 hover:shadow-soft transition-all duration-normal group"
              >
                <span className="text-[10px] font-sans uppercase tracking-widest text-terracotta block mb-1">
                  {other.badge}
                </span>
                <span className="font-serif text-lg text-forest group-hover:text-terracotta transition-colors block">
                  {other.name?.split('—')[0].trim() || other.title}
                </span>
                <span className="text-xs text-olive/75 line-clamp-2 mt-1 font-light">
                  {other.shortDescription}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>

      {/* Consultation Initiation Form */}
      <ConsultationCTA />
    </div>
  );
}
