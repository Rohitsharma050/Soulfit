import React from 'react';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';
import { Eye, Target, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div className="py-16 md:py-24 space-y-20">
      {/* Hero Banner */}
      <section>
        <Container size="default">
          <SectionHeading
            overline="The Founder’s Journey"
            title="Rashmi: Architect of"
            titleAccent="Balance & Conscious Living"
            description="Bridging ancient restorative traditions with contemporary life so wellness becomes an organic way of being, rather than a demanding routine."
            className="mb-12"
          />

          <div className="bg-sand-50 rounded-2xl border border-beige p-8 sm:p-12 shadow-soft grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-forest text-gold flex items-center justify-center font-serif text-3xl shadow-soft mb-4">
                ✦
              </div>
              <h3 className="font-serif text-3xl text-forest font-medium">Rashmi</h3>
              <p className="text-xs uppercase tracking-widest text-terracotta font-semibold mt-1">
                Founder, The Harmony Project &amp; Soulfit
              </p>
              <p className="text-xs text-olive font-serif italic mt-3 max-w-xs mx-auto">
                “Healing is an unbroken circle of Self, Space, and Fuel.”
              </p>
            </div>

            <div className="md:col-span-7 space-y-4 text-forest/80 text-sm leading-relaxed font-light">
              <p>
                In today's fast-paced world, all of us juggle deadlines, commutes, screens, family responsibilities, and a never-ending to-do list. The real difficulty is that after a long day of work and stress, many of us are simply too tired to listen to our inner signals.
              </p>
              <p>
                Our bodies ache, our minds remain full, and recovery becomes the hardest part of the routine. We often mistakenly assume that taking time for ourselves is selfish, forgetting that our body and mind fundamentally require rest to function.
              </p>
              <p>
                Rashmi established Soulfit and The Harmony Project to bridge this exact divide. With over a decade of deep practice in the wellness and restorative yoga space, her sanctuary provides tailored pathways for general fitness, lifetime disorder care (PCOD, Diabetes, Hypertension), and holistic balance.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Leadership Message Section */}
      <section className="bg-sand-50 py-16 border-y border-beige/60">
        <Container size="default">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="text-xs uppercase tracking-widest text-terracotta font-semibold block text-center">
              Leadership Philosophy
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-forest text-center font-normal">
              Building a Healthier Life, <span className="italic text-terracotta">One Mindful Step at a Time</span>
            </h2>

            <div className="space-y-4 text-forest/85 text-sm sm:text-base leading-relaxed font-light pt-4">
              <p>
                At Soulfit and The Harmony Project, we believe that true fitness extends far beyond physical exertion. It is about creating sustainable harmony between the body, the mind, living spaces, and personal lifestyle.
              </p>
              <blockquote className="border-l-4 border-terracotta pl-4 my-6 italic text-forest font-serif text-lg">
                “Real change comes when yoga slowly becomes a way of life. It does not have to be dramatic or time-consuming. It starts with a few mindful breaths between meetings, a gentle stretch before sleep, a slower meal, or one restorative session a week.”
              </blockquote>
              <p>
                Over time, this steady rhythm of practice becomes a lasting reservoir of energy. Sleep deepens, stress is handled with greater calm, the body moves with ease, and the mind stays clearer under pressure.
              </p>
              <p>
                We recognize that wellness is not always about pushing harder. Sometimes, it is about slowing down, listening attentively to your physical vessel, and honoring the biological need to restore.
              </p>
            </div>

            <div className="pt-8 text-center">
              <Button to="/#consultation" variant="primary" size="lg">
                Begin Your Journey With Rashmi
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
