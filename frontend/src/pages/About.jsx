import React from 'react';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';
import { 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Activity, 
  ShieldCheck, 
  ArrowRight,
  Sun,
  Smile,
  Leaf
} from 'lucide-react';

export default function About() {
  const scopeHighlights = [
    {
      title: 'Restorative Yoga & Daily Energy',
      description: 'Rest, calm, and sustained vitality for everyday life, whether at home or at work.',
      icon: Activity,
    },
    {
      title: 'Physical Condition Management',
      description: 'Targeted support for weight loss, mental well-being, and physical conditions like PCOD, Hypertension, and Diabetes.',
      icon: Heart,
    },
    {
      title: 'Life Stage Specialty Programs',
      description: 'Dedicated sessions for prenatal yoga, postnatal recovery, and fertility support.',
      icon: Leaf,
    },
    {
      title: 'Inclusive for Ages 10 and Above',
      description: 'Personalized yoga solutions designed for individuals aged 10 and above, regardless of age or gender.',
      icon: Users,
    },
  ];

  return (
    <div className="py-12 md:py-20 space-y-20 md:space-y-28 bg-sand">
      {/* 1. Header & Hero Introduction */}
      <section>
        <Container size="default">
          <SectionHeading
            overline="About Soulfit"
            title="The Home of"
            titleAccent="Restorative Yoga"
            description="Rest, calm and energy for everyday life, at home or at work. With over a decade of experience in the yoga industry, we specialize in personalized yoga solutions for every stage of life."
            className="mb-12"
          />

          {/* Official Soulfit Description Presentation */}
          <div className="bg-sand-50 rounded-2xl border-2 border-forest/15 p-8 sm:p-12 md:p-14 shadow-elevated grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Visual Medallion / Brand Icon (Span 4) */}
            <div className="lg:col-span-4 text-center space-y-4">
              <div className="w-28 h-28 mx-auto rounded-full bg-forest text-sand-light flex items-center justify-center font-serif text-3xl shadow-soft border-4 border-forest-light/40">
                <Sun className="w-12 h-12 text-gold animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-serif text-3xl text-forest font-medium">Soulfit</h3>
                <p className="text-xs uppercase tracking-widest text-forest font-bold mt-1">
                  The Complete Fitness Programme
                </p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-sans uppercase tracking-widest font-semibold bg-forest/10 text-forest border border-forest/20">
                  Over a Decade of Experience
                </span>
              </div>
            </div>

            {/* Official Copy (Span 8) */}
            <div className="lg:col-span-8 space-y-5 text-forest/85 text-base sm:text-lg leading-relaxed font-light">
              <p>
                Soulfit is the home of restorative yoga: rest, calm and energy for everyday life, at home or at work. With over more than decade of experiences in the yoga industry, we specializes in offering a wide range of yoga services, including sessions for weight loss, mental well being, and management of physical conditions such as PCOD, Hypertension, Diabetes etc.
              </p>

              <p>
                We also provide specialized programs such as prenatal yoga, postnatal yoga, and fertility yoga, ensuring that every stage of life is supported through the power of yoga.
              </p>

              <p>
                Our target audience includes individuals aged 10 and above, regardless of gender or age, who are looking for effective and personalized yoga solutions. We pride ourselves on our team of highly experienced and patient yoga instructors who bring a wealth of knowledge and expertise to every session.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Key Pillars of Our Practice */}
      <section className="bg-forest text-sand-light py-16 md:py-24 border-y border-forest-dark relative overflow-hidden">
        {/* Subtle Ambient Light */}
        <div 
          className="absolute -top-24 -left-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <Container size="wide">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
            <span className="text-xs uppercase tracking-[0.22em] text-gold font-semibold block">
              Scope of Guidance
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-sand font-normal">
              Effective &amp; Personalized Yoga Solutions
            </h2>
            <p className="text-sand/80 text-base font-light">
              Led by patient, highly experienced instructors bringing deep knowledge to every session.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {scopeHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-forest-light/60 border border-warmWhite/15 rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-gold/50 transition-colors"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-forest border border-gold/30 flex items-center justify-center mb-6 text-gold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-2xl text-sand font-normal mb-3">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-sand/80 font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-warmWhite/10">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-semibold">
                      Soulfit Standard
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. Section: The Soulfit Philosophy */}
      <section id="philosophy" className="py-6">
        <Container size="default">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-[0.22em] text-forest font-bold block">
                Living The Practice
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-forest font-normal">
                The Soulfit Philosophy
              </h2>
              <p className="font-serif italic text-lg text-forest-light">
                When Yoga Slowly Becomes a Way of Life
              </p>
            </div>

            {/* Editorial Presentation */}
            <div className="bg-sand-50 rounded-2xl border border-forest/15 p-8 sm:p-12 md:p-14 shadow-soft space-y-6 text-forest/85 text-base sm:text-lg leading-relaxed font-light">
              <p>
                The real change comes when yoga slowly becomes a way of life. It doesn't have to be dramatic or time-consuming. It can start with a few mindful breaths between meetings, a gentle stretch before bed, a slower and more attentive meal, or one restorative session a week. As these small practices repeat, they build awareness. You begin to notice when your body is tight, when your mind is racing and when you need to pause, and you learn to respond before exhaustion takes over.
              </p>

              {/* Restorative Quote Inset */}
              <div className="my-8 p-6 sm:p-8 rounded-xl bg-forest text-sand-light border-l-4 border-gold shadow-soft">
                <p className="font-serif italic text-lg sm:text-xl text-sand leading-relaxed">
                  “Over time, this steady rhythm of practice becomes a source of lasting energy. Sleep deepens, stress is handled with more calm, the body moves with greater ease, and the mind stays clearer under pressure.”
                </p>
              </div>

              <p>
                Yoga stops being something you do for an hour and becomes the way you live, work and recover. That is what keeps us going, not just through a demanding week, but through the many seasons of life.
              </p>

              <blockquote className="border-l-4 border-forest pl-4 sm:pl-6 my-6 italic text-forest font-serif text-xl sm:text-2xl font-medium">
                At Soulfit, we believe that rest isn't a luxury or a reward at the end of the week. It is part of being healthy, and it is what makes everything else possible, including your work, your relationships and your fitness goals.
              </blockquote>

              {/* Warm Personal Invitation */}
              <div className="mt-8 pt-8 border-t border-forest/15 bg-forest/5 p-6 sm:p-8 rounded-xl">
                <h4 className="font-serif text-2xl text-forest font-medium mb-3">
                  A Warm Invitation to Take a Pause
                </h4>
                <p className="font-serif italic text-lg text-forest leading-relaxed">
                  “I warmly invite you to take a pause with us. Come as you are, tired, busy and stretched, and leave feeling lighter, calmer and ready to begin afresh. Take one step today, and let us walk the rest of the path together.”
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-forest/70 font-sans">
                  <span>Soulfit Guidance &bull; The Harmony Project</span>
                  <span className="font-serif font-bold text-forest">The Soulfit Sanctuary</span>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <Button
                to="/#consultation"
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="bg-forest hover:bg-forest-light text-sand-light shadow-elevated"
              >
                Schedule Your Restorative Session
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
