import React, { useState } from 'react';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import { contactService } from '../services/api';
import { Mail, Clock, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [feedback, setFeedback] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status === 'error') setStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus('error');
      setFeedback('Please fill out all required fields.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    const res = await contactService.submitMessage(formData);
    if (res.success) {
      setStatus('success');
      setFeedback(res.message || 'Your inquiry has been received. Our guidance team will connect with you within 24 to 48 hours.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } else {
      setStatus('error');
      setFeedback(res.error || 'Unable to submit inquiry message. Please try again later.');
    }
  };

  return (
    <div className="py-16 md:py-24 space-y-16 bg-sand">
      <Container size="default">
        <SectionHeading
          overline="Direct Sanctuary Connect"
          title="Begin the Conversation for"
          titleAccent="Balanced Living"
          description="Have questions about our restorative yoga sessions, condition management (PCOD, Diabetes, Hypertension), or spatial Vastu guidance? We warmly invite you to reach out."
          className="mb-12"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Details & Sanctuary Values (Span 5) */}
          <div className="lg:col-span-5 bg-sand-50 rounded-2xl border-2 border-forest/15 p-8 shadow-soft space-y-6">
            <h3 className="font-serif text-2xl text-forest font-medium">
              Sanctuary Communications
            </h3>
            <p className="text-sm text-forest/75 font-light leading-relaxed">
              We approach every inquiry with patience and care. Whether you are seeking restorative movement for a demanding week or deep spatial alignment for your residence, we are here to support your path.
            </p>

            <div className="space-y-4 pt-4 border-t border-forest/10 text-xs text-forest/85">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-forest">Inquiries &amp; Consultations:</span>
                  <span className="text-forest/70">guidance@harmonyproject.com</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-forest">Operating Rhythm:</span>
                  <span className="text-forest/70">Monday &ndash; Saturday &bull; 08:00 AM &ndash; 07:00 PM IST</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-forest">Sanctuary Presence:</span>
                  <span className="text-forest/70">Soulfit Wellness Center &bull; Hybrid Sessions (Online &amp; In-Person)</span>
                </div>
              </div>
            </div>

            <blockquote className="border-l-2 border-forest pl-3 py-1 text-xs font-serif italic text-forest/80">
              “Come as you are &mdash; tired, busy, and stretched &mdash; and leave feeling lighter, calmer, and ready to begin afresh.”
            </blockquote>
          </div>

          {/* Contact Form (Span 7) */}
          <div className="lg:col-span-7 bg-sand-50 rounded-2xl border-2 border-forest/15 p-8 sm:p-10 shadow-soft">
            {status === 'success' ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-2xl text-forest font-medium">Message Received</h4>
                <p className="text-xs sm:text-sm text-forest/80 max-w-sm mx-auto font-light leading-relaxed">
                  {feedback}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-4 px-5 py-2 rounded-brand bg-forest text-sand-light text-xs uppercase tracking-wider font-semibold hover:bg-forest-light transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {status === 'error' && (
                  <div className="p-3 rounded-brand bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{feedback}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="name" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                      Your Name <span className="text-terracotta">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      required
                      className="w-full px-3.5 py-2 text-sm rounded-brand bg-sand border border-forest/15 text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div className="space-y-1">
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
                      className="w-full px-3.5 py-2 text-sm rounded-brand bg-sand border border-forest/15 text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="phone" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91..."
                      className="w-full px-3.5 py-2 text-sm rounded-brand bg-sand border border-forest/15 text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="subject" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                      Inquiry Topic
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g., Prenatal Restorative Yoga"
                      className="w-full px-3.5 py-2 text-sm rounded-brand bg-sand border border-forest/15 text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="message" className="block text-xs uppercase tracking-wider font-semibold text-forest">
                    Your Message <span className="text-terracotta">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How may we guide your wellness journey?"
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-brand bg-sand border border-forest/15 text-forest focus:outline-none focus:ring-2 focus:ring-forest resize-y"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full inline-flex items-center justify-center px-6 py-3 rounded-brand bg-forest hover:bg-forest-light text-sand-light font-semibold text-sm transition-colors shadow-forest gap-2 disabled:opacity-60"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sand-light" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
