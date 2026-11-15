import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import ConsultationCTA from '../components/home/ConsultationCTA';
import { servicesConfig } from '../config/servicesConfig';
import { servicesService } from '../services/api';
import { CheckCircle2, ArrowLeft, Clock, Compass } from 'lucide-react';

export default function ServiceDetail({ forcedSlug }) {
  const { slug } = useParams();
  const currentSlug = forcedSlug || slug;

  // 1. Synchronously resolve fallback data from the local client knowledge base
  // This guarantees immediate, non-stale rendering on the exact same frame route parameters change.
  const fallbackService = useMemo(() => {
    if (!currentSlug) return null;
    return (
      servicesConfig.find(
        (s) => s.slug === currentSlug || s.id === currentSlug
      ) || null
    );
  }, [currentSlug]);

  // 2. State for asynchronous API enrichment, network loading & errors
  const [apiService, setApiService] = useState(null);
  const [isLoading, setIsLoading] = useState(!fallbackService);
  const [hasCheckedApi, setHasCheckedApi] = useState(false);

  // 3. Effect: Synchronize with route parameter changes, abort stale requests & fetch live database updates
  useEffect(() => {
    if (!currentSlug) return;

    // Smoothly reset scroll position to page top on service navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const controller = new AbortController();
    let isCancelled = false;

    async function loadServiceData() {
      // If we already have local fallback data, keep UI responsive without full-screen loading blocker
      if (!fallbackService) {
        setIsLoading(true);
      }
      setHasCheckedApi(false);

      try {
        const res = await servicesService.getBySlug(currentSlug, {
          signal: controller.signal,
        });

        if (!isCancelled) {
          if (res.success && res.data) {
            const s = res.data;
            setApiService({
              id: s.id || s.slug,
              slug: s.slug,
              name: s.name || s.title?.split('—')[0]?.trim() || s.title || fallbackService?.name,
              title: s.title || fallbackService?.title,
              category: s.category || fallbackService?.category,
              detailedDescription: s.description || s.detailedDescription || s.short_description || fallbackService?.detailedDescription,
              shortDescription: s.short_description || s.shortDescription || fallbackService?.shortDescription,
              badge: s.badge || (s.display_order ? `Pillar 0${s.display_order}` : fallbackService?.badge),
              image: s.image_url || fallbackService?.image,
              offerings: Array.isArray(s.offerings)
                ? s.offerings
                : (s.offerings ? JSON.parse(s.offerings) : fallbackService?.offerings || []),
              principle: fallbackService?.principle || 'Rest is an unbroken circle of self, space, and conscious fuel.',
              sampleDailyInsight: fallbackService?.sampleDailyInsight,
            });
          } else {
            // API not returning data for this slug
            setApiService(null);
          }
        }
      } catch (err) {
        if (!isCancelled && err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setApiService(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setHasCheckedApi(true);
        }
      }
    }

    loadServiceData();

    // Abort in-flight request when user navigates to another service
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [currentSlug, fallbackService]);

  // 4. Derive current service: ONLY use apiService if its slug matches the active route!
  // This strictly eliminates race conditions and ensures previous service data never leaks onto the screen.
  const isMatchingApiData = Boolean(
    apiService && (apiService.slug === currentSlug || apiService.id === currentSlug)
  );
  const currentService = isMatchingApiData ? apiService : fallbackService;

  // 5. Derive interconnected pillars for navigation carousel at page footer
  const otherServices = useMemo(() => {
    return servicesConfig.filter(
      (s) => s.slug !== currentSlug && s.id !== currentSlug
    );
  }, [currentSlug]);

  // Loading state when navigating to an unknown slug without local fallback
  if (isLoading && !currentService) {
    return (
      <div className="py-20 md:py-28 animate-pulse">
        <Container size="default">
          <div className="h-4 w-32 bg-beige rounded mb-6" />
          <div className="h-10 w-3/4 bg-beige rounded mb-4" />
          <div className="h-6 w-1/2 bg-beige/60 rounded mb-8" />
          <div className="aspect-[16/9] w-full bg-sand-50 rounded-2xl border border-beige mb-10" />
        </Container>
      </div>
    );
  }

  // Not Found State for invalid service slugs
  if (!currentService && hasCheckedApi) {
    return (
      <div className="py-20 md:py-32 text-center space-y-6">
        <Container size="default">
          <div className="max-w-md mx-auto space-y-4">
            <span className="text-xs uppercase tracking-widest text-terracotta font-semibold block">
              Sanctuary Navigation
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-forest font-normal">
              Wellness Pillar Not Found
            </h1>
            <p className="text-olive text-sm sm:text-base font-light leading-relaxed">
              We could not find the wellness pillar &ldquo;{currentSlug}&rdquo;. It may have been updated or relocated.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button to="/services" variant="primary" icon={ArrowLeft} iconPosition="left">
                View All Five Pillars
              </Button>
              <Button to="/" variant="secondary">
                Return Home
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!currentService) return null;

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
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        </div>

        {/* Guiding Principle Callout */}
        {currentService.principle && (
          <div className="p-8 rounded-2xl bg-sand-50 border border-beige shadow-soft my-10">
            <span className="text-xs uppercase tracking-widest text-terracotta font-semibold block mb-2">
              Sanctuary Core Principle
            </span>
            <blockquote className="font-serif italic text-2xl text-forest leading-relaxed">
              &ldquo;{currentService.principle}&rdquo;
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

        {/* Other Pillars Mini Grid */}
        <div className="pt-16 border-t border-beige/60 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl text-forest font-normal">
              Explore Interconnected Pillars
            </h3>
            <Link
              to="/services"
              className="text-xs uppercase tracking-widest text-terracotta hover:underline font-semibold"
            >
              Overview &rarr;
            </Link>
          </div>

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
                  {other.name?.split('—')[0]?.trim() || other.title}
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
