import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import Container from '../components/common/Container';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ArrowRight, Info, X } from 'lucide-react';

export default function Login() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Read return destination or default to /dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // Read query params for potential OAuth error redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      if (oauthError === 'oauth_cancelled') {
        setErrorMessage('Google authentication was cancelled.');
      } else if (oauthError === 'oauth_failed') {
        setErrorMessage('Google sign-in could not be completed. Please try again or use your password.');
      } else {
        setErrorMessage('Authentication could not be completed. Please try again.');
      }
    }
  }, [location.search]);

  // If already authenticated, redirect
  useEffect(() => {
    if (user && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.error || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  return (
    <div className="py-16 md:py-24 bg-sand min-h-[calc(100vh-140px)] flex items-center">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          {/* Sanctuary Header */}
          <div className="text-center mb-8">
            <span className="text-[11px] font-sans font-bold tracking-widest uppercase text-forest/70 block mb-2">
              Sanctuary Access
            </span>
            <h1 className="text-3xl md:text-4xl font-serif text-forest mb-3">
              Welcome Back
            </h1>
            <p className="text-sm font-sans text-forest/75 leading-relaxed">
              Sign in to continue your journey of conscious vitality, alignment, and holistic wellbeing.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-sand-50 rounded-brand-lg border border-forest/15 shadow-soft p-6 sm:p-8">
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-brand border border-forest/20 bg-sand text-forest font-medium text-sm hover:bg-forest/5 hover:border-forest/40 transition-colors focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Subtle Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-forest/15" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-sand-50 px-3 text-forest/60 font-sans uppercase tracking-wider text-[10px]">
                  Or sign in with email
                </span>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-brand bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-forest/40">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-brand bg-sand border border-forest/20 text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-sans font-medium text-forest/80"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-forest/70 hover:text-forest underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-forest/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-brand bg-sand border border-forest/20 text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-forest/50 hover:text-forest transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-forest/80">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-forest/30 text-forest focus:ring-forest/30"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-brand bg-forest text-sand-light font-medium text-sm shadow-soft hover:bg-forest-light transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-forest/50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Sanctuary</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 pt-5 border-t border-forest/10 text-center">
              <p className="text-xs text-forest/70 font-sans">
                Do not have a sanctuary profile yet?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-forest hover:text-forest-light underline ml-1"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Forgot Password Informational Dialog */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-title"
        >
          <div className="bg-sand-50 rounded-brand-lg border border-forest/20 shadow-elevated max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-forest">
                  <Info className="w-4 h-4" />
                </div>
                <h3 id="recovery-title" className="font-serif text-lg text-forest">
                  Sanctuary Account Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-forest/60 hover:text-forest p-1 rounded-brand"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-forest/80 leading-relaxed mb-4 font-sans">
              For your account safety and member confidentiality, password resets are processed directly by our administration team.
            </p>
            <p className="text-xs text-forest/70 leading-relaxed mb-6 font-sans">
              Please submit an inquiry through our direct contact page or write to our support concierge at{' '}
              <span className="font-mono text-forest font-semibold">care@soulfit.wellness</span> from your registered email address.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs rounded-brand border border-forest/20 text-forest hover:bg-forest/5"
              >
                Close
              </button>
              <Link
                to="/contact"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-xs rounded-brand bg-forest text-sand-light hover:bg-forest-light transition-colors"
              >
                Go to Contact Form
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
