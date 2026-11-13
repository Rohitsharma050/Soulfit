import React, { useState } from 'react';
import { newsletterService } from '../../services/api';
import { Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function NewsletterForm({ variant = 'footer', className = '' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    const result = await newsletterService.subscribe(email.trim());

    if (result.success) {
      setStatus('success');
      setMessage('Thank you for joining our circle. A confirmation has been recorded.');
      setEmail('');
    } else {
      setStatus('error');
      // Graceful error display without clearing user input
      setMessage(result.error || 'The newsletter subscription service is currently connecting. Please try again shortly.');
    }
  };

  const isFooter = variant === 'footer';

  return (
    <div className={`w-full ${className}`}>
      {status === 'success' ? (
        <div className={`p-4 rounded-brand flex items-start gap-3 ${
          isFooter ? 'bg-forest-light text-sand-light border border-gold/40' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
        }`}>
          <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-serif font-medium text-sm">{message}</p>
            <button
              onClick={() => { setStatus('idle'); setMessage(''); }}
              className="text-xs underline text-gold hover:text-gold-light mt-2"
            >
              Subscribe another email
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                id="newsletter-email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                disabled={status === 'loading'}
                placeholder="Enter your email address..."
                aria-label="Email for wellness digest"
                aria-invalid={status === 'error'}
                aria-describedby={message ? 'newsletter-msg' : undefined}
                className={`w-full px-4 py-2.5 text-sm rounded-brand transition-colors focus:outline-none focus:ring-2 focus:ring-gold ${
                  isFooter 
                    ? 'bg-forest-light/60 border border-warmWhite/20 text-sand placeholder:text-sand/50 focus:border-gold' 
                    : 'bg-sand border border-beige text-forest placeholder:text-olive/60 focus:border-terracotta'
                } ${status === 'error' ? 'border-terracotta' : ''}`}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-brand bg-gold hover:bg-gold-light active:bg-gold-dark text-forest font-medium text-sm transition-all duration-normal shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold disabled:opacity-60 flex-shrink-0 gap-1.5"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-forest" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Feedback Messages */}
          {status === 'error' && (
            <div id="newsletter-msg" className="flex items-center gap-1.5 text-xs text-terracotta-light pt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
