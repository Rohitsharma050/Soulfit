import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import { journalConfig } from '../../config/journalConfig';

export default function JournalSection() {
  return (
    <section id="journal" className="py-20 md:py-28 bg-sand border-b border-beige/60">
      <Container size="wide">
        {/* Section Header with Explore All Link */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <SectionHeading
            overline="Knowledge Sanctuary"
            title="Latest Insights &amp;"
            titleAccent="Dispatches"
            description="Explore thoughtful reflections on wellness, ancient wisdom, seasonal nourishment, and the art of balanced living."
            align="left"
            className="md:mx-0"
          />

          <Link
            to="/journal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-forest hover:text-terracotta transition-colors pb-1 flex-shrink-0"
          >
            <span>Explore All Publications</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Publication Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {journalConfig.slice(0, 3).map((article) => (
            <article
              key={article.id}
              className="group bg-sand-50 rounded-2xl border border-beige/80 overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-normal flex flex-col justify-between"
            >
              {/* Card Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-slow group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-sans uppercase tracking-widest font-semibold bg-sand-50/95 backdrop-blur-sm text-terracotta border border-beige shadow-sm">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-2xl text-forest font-normal leading-snug mb-3 group-hover:text-terracotta transition-colors line-clamp-2">
                    <Link to="/journal">
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-forest/75 font-light leading-relaxed mb-6 line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                {/* Card Meta & Read Action */}
                <div className="pt-4 border-t border-beige/60 flex items-center justify-between text-xs text-olive">
                  <div className="flex items-center gap-2">
                    <span className="font-serif italic text-forest">By {article.author}</span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {article.readingTime}
                    </span>
                  </div>

                  <Link
                    to="/journal"
                    className="font-semibold text-terracotta group-hover:underline inline-flex items-center gap-1"
                  >
                    <span>Read Brief</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
