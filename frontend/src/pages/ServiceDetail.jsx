import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import ConsultationCTA from '../components/home/ConsultationCTA';
import { servicesConfig } from '../config/servicesConfig';
import { servicesService } from '../services/api';
import { CheckCircle2, ArrowLeft, Clock } from 'lucide-react';

export default function ServiceDetail({ forcedSlug }) {
  const { slug } = useParams();
  const currentSlug = forcedSlug || slug;

  // 1. Synchronously resolve fallback data from local config
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

  // 3. Effect: Synchronize with route parameter changes
  useEffect(() => {
    if (!currentSlug) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const controller = new AbortController();
    let isCancelled = false;

    async function loadServiceData() {
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
              name: fallbackService?.name || s.title?.split('—')[0]?.trim() || s.title,
              title: s.title || fallbackService?.title,
              category: s.category || fallbackService?.category,
              detailedDescription: s.description || s.detailedDescription || s.short_description || fallbackService?.detailedDescription,
              shortDescription: s.short_description || s.shortDescription || fallbackService?.shortDescription,
              badge: s.badge || (s.display_order ? `Pillar 0${s.display_order}` : fallbackService?.badge),
              image: s.image_url || fallbackService?.image,
              offerings: Array.isArray(s.offerings)
                ? s.offerings
                : (s.offerings ? JSON.parse(s.offerings) : fallbackService?.offerings || []),
              principle: fallbackService?.principle || "Rest isn't a luxury or a reward; it is what makes everything else possible.",
              sampleDailyInsight: fallbackService?.sampleDailyInsight,
            });
          } else {
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

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [currentSlug, fallbackService]);

  const isMatchingApiData = Boolean(
    apiService && (apiService.slug === currentSlug || apiService.id === currentSlug)
  );
  const currentService = isMatchingApiData ? apiService : fallbackService;

  const otherServices = useMemo(() => {
    return servicesConfig.filter(
      (s) => s.slug !== currentSlug && s.id !== currentSlug
    );
  }, [currentSlug]);

  if (isLoading && !currentService) {
    return (
      <div className="py-20 md:py-28 animate-pulse bg-sand">
        <Container size="default">
          <div className="h-4 w-32 bg-forest/10 rounded mb-6" />
          <div className="h-10 w-3/4 bg-forest/15 rounded mb-4" />
          <div className="h-6 w-1/2 bg-forest/10 rounded mb-8" />
          <div className="aspect-[16/9] w-full bg-sand-50 rounded-2xl border border-forest/15 mb-10" />
        </Container>
      </div>
    );
  }

  if (!currentService && hasCheckedApi) {
    return (
      <div className="py-20 md:py-32 text-center space-y-6 bg-sand">
        <Container size="default">
          <div className="max-w-md mx-auto space-y-4">
            <span className="text-xs uppercase tracking-widest text-forest font-bold block">
              Sanctuary Navigation
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-forest font-normal">
              Wellness Pillar Not Found
            </h1>
            <p className="text-forest/75 text-sm sm:text-base font-light leading-relaxed">
              We could not find the wellness pillar &ldquo;{currentSlug}&rdquo;. It may have been updated or relocated.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button to="/services" variant="primary" icon={ArrowLeft} iconPosition="left" className="bg-forest hover:bg-forest-light text-sand-light">
                View All Five Pillars
              </Button>
              <Button to="/" variant="secondary" className="border-forest/20 text-forest hover:bg-forest/5">
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
    <div className="py-12 md:py-20 space-y-16 bg-sand">
      <Container size="default">
        {/* Breadcrumb / Back Link */}
        <div className="mb-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest hover:text-forest-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Five Pillars</span>
          </Link>
        </div>

        {/* Hero Section of the Service */}
        <div className="space-y-6 max-w-3xl">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-forest/10 text-forest uppercase tracking-wider border border-forest/20">
            {currentService.badge} &bull; {currentService.category}
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-forest font-normal leading-tight">
            {currentService.name}
          </h1>

          <p className="text-xl font-serif italic text-forest-light">
            {currentService.title}
          </p>

          <p className="text-base sm:text-lg text-forest/80 font-light leading-relaxed">
            {currentService.detailedDescription}
          </p>
        </div>

        {/* Feature Image Banner */}
        <div className="my-10 rounded-2xl overflow-hidden aspect-[16/9] shadow-elevated border-2 border-forest/20 bg-sand-50">
          <img
            src={currentService.image}
            alt={currentService.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        </div>

        {/* Guiding Principle Callout in Forest Green */}
        {currentService.principle && (
          <div className="p-8 sm:p-10 rounded-2xl bg-forest text-sand-light shadow-elevated my-10 border border-forest-dark">
            <span className="text-xs uppercase tracking-widest text-gold font-semibold block mb-2">
              Sanctuary Core Principle
            </span>
            <blockquote className="font-serif italic text-2xl sm:text-3xl text-sand leading-relaxed">
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
                <div key={idx} className="p-5 rounded-xl bg-sand-50 border border-forest/15 flex items-start gap-3 shadow-soft">
                  <CheckCircle2 className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-forest/90 font-light">{offering}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Healing Cycle if available */}
        {currentService.sampleDailyInsight && (
          <div className="p-6 rounded-2xl bg-forest/5 border border-forest/20 mt-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-forest uppercase tracking-wider">
              <Clock className="w-4 h-4 text-forest" />
              <span>{currentService.sampleDailyInsight.timing}</span>
            </div>
            <p className="text-sm text-forest/85 leading-relaxed font-light">
              {currentService.sampleDailyInsight.practice}
            </p>
          </div>
        )}

        {/* Other Pillars Mini Grid */}
        <div className="pt-16 border-t border-forest/15 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl text-forest font-normal">
              Explore Interconnected Pillars
            </h3>
            <Link
              to="/services"
              className="text-xs uppercase tracking-widest text-forest hover:text-forest-light font-bold underline"
            >
              Overview &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherServices.map((other) => (
              <Link
                key={other.id || other.slug}
                to={other.path}
                className="p-4 rounded-xl bg-sand-50 border border-forest/15 hover:border-forest hover:shadow-soft transition-all duration-normal group"
              >
                <span className="text-[10px] font-sans uppercase tracking-widest text-forest font-bold block mb-1">
                  {other.badge}
                </span>
                <span className="font-serif text-lg text-forest group-hover:text-forest-light transition-colors block">
                  {other.name?.split('—')[0]?.trim() || other.title}
                </span>
                <span className="text-xs text-forest/70 line-clamp-2 mt-1 font-light">
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
