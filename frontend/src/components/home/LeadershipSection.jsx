import React from 'react';
import Container from '../common/Container';
import Button from '../common/Button';
import { Calendar, Sparkles, Heart } from 'lucide-react';

export default function LeadershipSection() {
  return (
    <section id="leadership" className="py-20 md:py-28 bg-sand border-b border-forest/10 relative overflow-hidden">
      {/* Subtle Forest Ambient Lighting */}
      <div 
        className="absolute top-1/2 left-0 w-96 h-96 bg-forest/5 rounded-full blur-3xl pointer-events-none -z-10 -translate-y-1/2" 
        aria-hidden="true" 
      />

      <Container size="default">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs font-semibold uppercase tracking-[0.22em]">
            <Sparkles className="w-3.5 h-3.5 text-forest" />
            <span>Guiding Vision</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-forest font-normal leading-tight">
            A Message from the Leadership
          </h2>

          <p className="font-serif italic text-lg sm:text-xl text-forest-light font-normal">
            Building a Healthier Life, One Mindful Step at a Time
          </p>
        </div>

        {/* Editorial Leadership Paper Container */}
        <div className="bg-sand-50 rounded-2xl border border-forest/15 p-8 sm:p-12 md:p-16 shadow-elevated relative max-w-4xl mx-auto">
          {/* Subtle Corner Emblem */}
          <div className="absolute top-6 right-6 text-forest/20 font-serif text-3xl select-none hidden sm:block" aria-hidden="true">
            ✦
          </div>

          <div className="prose prose-lg max-w-none text-forest/85 space-y-6 text-base sm:text-lg leading-relaxed font-light">
            <p>
              At Soulfit, we believe that true fitness goes beyond physical strength. It is about creating harmony between the body, mind and lifestyle. In today's fast-paced world, where professional commitments, personal responsibilities and everyday pressures often take priority, taking care of ourselves can become the most neglected part of our lives.
            </p>

            <p className="font-serif text-xl sm:text-2xl text-forest font-medium italic">
              Our vision at Soulfit is to change that.
            </p>

            <p>
              We believe wellness should not feel like another responsibility on your to-do list. It should become a natural and enjoyable part of everyday living. Through fitness, mindful movement, yoga, nutrition and restorative practices, we aim to create an environment where individuals can reconnect with themselves, build strength, restore balance and discover their true potential.
            </p>

            <p>
              We also recognise that fitness is not always about pushing harder. Sometimes, it is about slowing down, listening to your body and allowing yourself the time to recover. Our Recovery and Restoration initiatives reflect this belief, encouraging people to embrace rest as an essential part of a healthy and sustainable lifestyle.
            </p>

            {/* Inset Core Philosophy Callout in Forest Green */}
            <div className="my-8 p-6 sm:p-8 rounded-xl bg-forest text-sand-light shadow-soft border border-forest-dark">
              <span className="text-xs uppercase tracking-widest text-gold font-semibold block mb-2">
                Our Core Philosophy
              </span>
              <p className="font-serif italic text-lg sm:text-xl text-sand leading-relaxed">
                “Lasting transformation comes from consistency, awareness and small positive changes. A mindful breath, a few minutes of movement, healthier food choices or a moment of relaxation can gradually create a meaningful difference in how we live.”
              </p>
            </div>

            <p>
              As a leadership team, our commitment is to make wellness more accessible, practical and sustainable for everyone. We strive to build a community that inspires people to move better, feel stronger, think clearer and live healthier.
            </p>

            <p>
              At Soulfit, we are not simply encouraging people to exercise. We are encouraging them to embrace a lifestyle that supports their physical, mental and emotional well-being.
            </p>

            <blockquote className="border-l-4 border-forest pl-4 sm:pl-6 my-6 italic font-serif text-xl sm:text-2xl text-forest font-medium">
              “When you take care of yourself, you create the strength to take on everything else.”
            </blockquote>

            <p>
              We invite you to be a part of the Soulfit journey. Let's move forward together, build healthier habits and create a better, more balanced way of life.
            </p>

            {/* Brand Motto */}
            <div className="pt-4 pb-2">
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-forest tracking-wide">
                Move. Restore. Be Better.
              </p>
            </div>

            {/* Signature & Sign-Off */}
            <div className="pt-6 border-t border-forest/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-light text-forest/70 italic">With warmth and commitment,</p>
                <p className="font-serif text-xl sm:text-2xl font-bold text-forest mt-1">
                  The Leadership Team
                </p>
                <p className="text-xs uppercase tracking-widest text-forest/70 font-semibold mt-0.5">
                  Soulfit &bull; The Harmony Project
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  to="/#consultation"
                  variant="primary"
                  size="md"
                  icon={Calendar}
                  iconPosition="right"
                  className="bg-forest hover:bg-forest-light text-sand-light shadow-soft"
                >
                  Schedule Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
