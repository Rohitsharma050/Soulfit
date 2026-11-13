import React from 'react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import { approvedTestimonials } from '../../config/testimonialsConfig';

/**
 * Testimonials Component
 * Strictly adheres to project ethics: hides gracefully when approvedTestimonials is empty,
 * preventing any fabrication of customer feedback or artificial ratings.
 */
export default function Testimonials() {
  if (!approvedTestimonials || approvedTestimonials.length === 0) {
    // Graceful omission until genuine client feedback is approved
    return null;
  }

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-sand border-b border-beige/60">
      <Container size="wide">
        <SectionHeading
          overline="Client Experiences"
          title="Reflections From"
          titleAccent="Our Community"
          description="Stories of restored calm, elemental clarity, and sustainable vitality."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedTestimonials.map((item, idx) => (
            <div key={idx} className="bg-sand-50 rounded-2xl border border-beige p-8 shadow-soft flex flex-col justify-between">
              <blockquote className="font-serif italic text-base text-forest/90 mb-6 leading-relaxed">
                “{item.quote}”
              </blockquote>
              <div className="border-t border-beige/60 pt-4 flex items-center justify-between text-xs">
                <span className="font-semibold text-forest">{item.author}</span>
                <span className="text-olive">{item.pillar}</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
