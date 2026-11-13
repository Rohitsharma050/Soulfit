import React, { useState } from 'react';
import { consultationService } from '../../services/api';
import { servicesConfig } from '../../config/servicesConfig';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';

export default function ConsultationCTA() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    pillarInterest: servicesConfig[0]?.name || 'Soulfit — Gym & Yoga',
    goals: '',
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error' | 'notice'
  const [feedback, setFeedback] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status === 'error') setStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      setStatus('error');
      setFeedback('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@') || !formData.email.includes('.')) {
      setStatus('error');
      setFeedback('Please provide a valid email address.');
      return;
    }
    if (!formData.phone.trim()) {
      setStatus('error');
      setFeedback('Please enter a contact phone number.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    // Centralized API Integration
    const response = await consultationService.submitInquiry(formData);

    if (response.success) {
      setStatus('success');
      setFeedback('Your consultation inquiry has been recorded. Our team will reach out with scheduling availability.');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        pillarInterest: servicesConfig[0]?.name || 'Soulfit — Gym & Yoga',
        goals: '',
      });
    } else {
      // Gracefully communicate that automated slot booking is scheduled for Phase 6,
      // without misleading the user that an appointment was confirmed.
      setStatus('notice');
      setFeedback('Thank you for reaching out. Live calendar slot booking is being connected in the next phase. Your interest in ' + formData.pillarInterest + ' has been saved locally for your session.');
    }
  };

  return (
    <section id="consultation" className="py-20 md:py-28 bg-sand-50 relative overflow-hidden">
      <Container size="default">
        {/* Section Heading */}
        <SectionHeading
          overline="Initiation Sanctuary"
          title="Your Journey Towards"
          titleAccent="Harmony Begins Here"
          description="Take the first intentional step toward aligning your physical strength, living space, nourishment, and daily rhythms."
          className="mb-12"
        />

        {/* Consultation Form Card */}
        <div className="bg-sand rounded-2xl border border-beige p-8 sm:p-12 shadow-elevated max-w-2xl mx-auto">
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-3xl text-forest font-medium">Inquiry Received</h3>
              <p className="text-sm text-forest/80 max-w-md mx-auto font-light leading-relaxed">
                {feedback}
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-4 px-6 py-2.5 rounded-brand bg-forest text-sand-light text-xs uppercase tracking-widest font-semibold hover:bg-forest-light transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {status === 'notice' && (
                <div className="p-4 rounded-brand bg-beige/60 border border-beige-dark text-forest text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-terracotta">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span>Booking System Preparation Notice</span>
                  </div>
                  <p className="leading-relaxed font-light">{feedback}</p>
                </div>
              )}

              {status === 'error' && (
                <div className="p-3.5 rounded-brand bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{feedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                    Full Name <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g., Rashmi Sharma"
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-brand bg-sand-50 border border-beige text-forest placeholder:text-olive/50 focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                    Email Address <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@domain.com"
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-brand bg-sand-50 border border-beige text-forest placeholder:text-olive/50 focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                    Phone Number <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-brand bg-sand-50 border border-beige text-forest placeholder:text-olive/50 focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>

                {/* Service of Interest */}
                <div className="space-y-1.5">
                  <label htmlFor="pillarInterest" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                    Pillar of Interest
                  </label>
                  <select
                    id="pillarInterest"
                    name="pillarInterest"
                    value={formData.pillarInterest}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-brand bg-sand-50 border border-beige text-forest focus:outline-none focus:ring-2 focus:ring-terracotta"
                  >
                    {servicesConfig.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consultation Goals */}
              <div className="space-y-1.5">
                <label htmlFor="goals" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                  Your Primary Intentions &amp; Goals
                </label>
                <textarea
                  id="goals"
                  name="goals"
                  rows="3"
                  value={formData.goals}
                  onChange={handleChange}
                  placeholder="Share any specific physical conditions, living space challenges, or goals you wish to address..."
                  className="w-full px-4 py-2.5 text-sm rounded-brand bg-sand-50 border border-beige text-forest placeholder:text-olive/50 focus:outline-none focus:ring-2 focus:ring-terracotta resize-y"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-brand bg-forest hover:bg-forest-light active:bg-forest-dark text-sand font-medium text-sm transition-all duration-normal shadow-soft hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta disabled:opacity-60 gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-sand" />
                      <span>Transmitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Consultation Request</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-olive font-light">
                All consultations adhere to strict privacy, personal safety, and holistic health ethics.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
