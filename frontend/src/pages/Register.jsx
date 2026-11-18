import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/api';
import Container from '../components/common/Container';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, Loader2, ArrowRight, Check, X } from 'lucide-react';

export default function Register() {
  const { user, register, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Read query params for potential OAuth error redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      if (oauthError === 'oauth_cancelled') {
        setErrorMessage('Google authentication was cancelled.');
      } else if (oauthError === 'oauth_failed') {
        setErrorMessage('Google sign-in could not be completed. Please try again or use your password.');
      } else if (oauthError === 'google_not_configured' || oauthError === 'oauth_unconfigured') {
        setErrorMessage(
          'Google Sign-In is awaiting credentials in backend/.env. Please register with your email and password, or configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
        );
      } else {
        setErrorMessage(decodeURIComponent(oauthError) || 'Authentication could not be completed. Please try again.');
      }
    }
  }, [location.search]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Dynamic Password Strength Evaluation
  const passwordStrength = useMemo(() => {
    const pw = formData.password;
    if (!pw) return { score: 0, label: '', color: '', meetsLength: false, hasLetter: false, hasNumber: false };

    const meetsLength = pw.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pw);

    let score = 0;
    if (meetsLength) score += 1;
    if (hasLetter) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    let label = 'Weak';
    let color = 'bg-red-500';

    if (score >= 4) {
      label = 'Strong';
      color = 'bg-forest';
    } else if (score >= 3) {
      label = 'Good';
      color = 'bg-emerald-600';
    } else if (score >= 2) {
      label = 'Fair';
      color = 'bg-amber-500';
    }

    return {
      score,
      label,
      color,
      meetsLength,
      hasLetter,
      hasNumber,
      hasSpecial,
    };
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one letter and one number.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setErrorMessage('Please correct the highlighted fields before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setFieldErrors({});

    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMessage(result.error || 'Registration failed. Please check your details.');
        if (result.errors && Array.isArray(result.errors)) {
          const mapped = {};
          result.errors.forEach((err) => {
            const field = err.path?.[0] || 'form';
            mapped[field] = err.message;
          });
          setFieldErrors(mapped);
        }
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during registration. Please try again.');
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
              Sanctuary Membership
            </span>
            <h1 className="text-3xl md:text-4xl font-serif text-forest mb-3">
              Join The Harmony Project
            </h1>
            <p className="text-sm font-sans text-forest/75 leading-relaxed">
              Create your sanctuary account to access tailored yoga programs, spatial Vastu wisdom, and holistic wellness guidance.
            </p>
          </div>

          {/* Registration Card */}
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
                  Or register with email
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-forest/40">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Rohit Sharma"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-brand bg-sand border text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors ${
                      fieldErrors.name ? 'border-red-400 focus:border-red-500' : 'border-forest/20 focus:border-forest'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email Address */}
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
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-brand bg-sand border text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors ${
                      fieldErrors.email ? 'border-red-400 focus:border-red-500' : 'border-forest/20 focus:border-forest'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-forest/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters with letter & number"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-brand bg-sand border text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors ${
                      fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-forest/20 focus:border-forest'
                    }`}
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
                {fieldErrors.password && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans">{fieldErrors.password}</p>
                )}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-forest/70 font-sans">Password Strength:</span>
                      <span className="font-semibold text-forest font-sans">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-forest/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-forest/70">
                      <span className="flex items-center gap-1">
                        {passwordStrength.meetsLength ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-forest/40" />
                        )}
                        8+ characters
                      </span>
                      <span className="flex items-center gap-1">
                        {passwordStrength.hasLetter ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-forest/40" />
                        )}
                        Contains letters
                      </span>
                      <span className="flex items-center gap-1">
                        {passwordStrength.hasNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <X className="w-3 h-3 text-forest/40" />
                        )}
                        Contains numbers
                      </span>
                      <span className="flex items-center gap-1">
                        {passwordStrength.hasSpecial ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <span className="w-3 h-3 inline-block" />
                        )}
                        Special char (optional)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-forest/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-brand bg-sand border text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 transition-colors ${
                      fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-forest/20 focus:border-forest'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-forest/50 hover:text-forest transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-red-600 font-sans">{fieldErrors.confirmPassword}</p>
                )}
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
                    <span>Creating your profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create Sanctuary Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 pt-5 border-t border-forest/10 text-center">
              <p className="text-xs text-forest/70 font-sans">
                Already registered with The Harmony Project?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-forest hover:text-forest-light underline ml-1"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
