import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { consultationService } from '../services/api';
import Container from '../components/common/Container';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  LogOut,
  Sparkles,
  Compass,
  ArrowRight,
  Plus,
  CalendarCheck,
  CheckCircle,
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    async function loadUpcoming() {
      setLoadingSessions(true);
      const res = await consultationService.getMyConsultations({ status: 'upcoming', limit: 3 });
      if (res.success && res.data) {
        setUpcomingSessions(res.data);
      }
      setLoadingSessions(false);
    }
    loadUpcoming();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Active';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Current session';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="py-12 md:py-20 bg-sand min-h-[calc(100vh-140px)]">
      <Container size="default">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-forest/15">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-mono font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sanctuary Member Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif text-forest">
              Welcome, {user?.name || 'Sanctuary Member'}
            </h1>
            <p className="mt-2 text-sm md:text-base text-forest/75 font-sans max-w-2xl leading-relaxed">
              Your personal portal within The Harmony Project — integrating physical vitality, spatial alignment, cosmic understanding, and conscious living.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-brand bg-forest text-sand-light text-sm font-medium hover:bg-forest-light shadow-soft transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Book Session</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-brand border border-forest/20 text-forest text-sm font-medium hover:bg-forest/5 hover:border-forest/40 transition-colors focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          {/* Left Column: Identity & Account Profile (Span 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-sand-50 rounded-brand-lg border border-forest/15 p-6 shadow-soft">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-forest/10">
                <div className="w-16 h-16 rounded-full bg-forest text-sand-light font-serif text-2xl flex items-center justify-center font-bold shadow-soft">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
                  )}
                </div>
                <div>
                  <h2 className="font-serif text-xl text-forest">{user?.name}</h2>
                  <p className="text-xs text-forest/70 font-sans mt-0.5">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-forest/10 text-forest font-semibold">
                      <Shield className="w-3 h-3" />
                      {user?.role || 'member'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-sand border border-forest/15 text-forest/80">
                      {user?.auth_provider === 'google' ? 'Google Account' : 'Email Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Meta List */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-forest/80">
                  <span className="flex items-center gap-2 text-forest/60">
                    <Calendar className="w-3.5 h-3.5" />
                    Member Since:
                  </span>
                  <span className="font-medium">{formatDate(user?.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-forest/80">
                  <span className="flex items-center gap-2 text-forest/60">
                    <Clock className="w-3.5 h-3.5" />
                    Last Active:
                  </span>
                  <span className="font-medium">{formatDateTime(user?.last_login_at)}</span>
                </div>
                <div className="flex items-center justify-between text-forest/80">
                  <span className="flex items-center gap-2 text-forest/60">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Account Status:
                  </span>
                  <span className="text-emerald-700 font-semibold font-mono text-[11px]">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Restorative Wisdom Quote Card */}
            <div className="bg-forest text-sand-light rounded-brand-lg p-6 shadow-soft space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-sand-light/60">
                Restorative Philosophy
              </span>
              <p className="font-serif italic text-base leading-relaxed text-sand-light/95">
                “Recovery becomes the most essential part of your routine. Listen to your inner needs — taking time for yourself is conscious care, not selfishness.”
              </p>
              <p className="text-[11px] font-sans text-sand-light/75">
                — Soulfit Sanctuary Principles
              </p>
            </div>
          </div>

          {/* Right Column: Upcoming Consultations & Sanctuary Pillars (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Upcoming Consultations Card */}
            <div className="bg-sand-50 rounded-brand-lg border border-forest/20 p-6 md:p-8 shadow-soft">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-forest/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-brand bg-forest/10 text-forest">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-forest">
                      Upcoming Consultations
                    </h3>
                  </div>
                </div>

                <Link
                  to="/my-consultations"
                  className="text-xs text-forest font-medium hover:text-forest-light underline"
                >
                  View All &rarr;
                </Link>
              </div>

              {loadingSessions ? (
                <div className="py-8 flex items-center justify-center text-xs text-forest/60">
                  <span>Loading scheduled sessions...</span>
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-brand bg-sand border border-forest/15 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <span className="font-mono text-[10px] uppercase bg-forest/10 text-forest px-2 py-0.5 rounded font-bold">
                          {session.booking_reference}
                        </span>
                        <h4 className="font-serif text-sm font-semibold text-forest mt-1">
                          {session.type_name || session.pillar_interest}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-forest/70 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-forest/50" />
                            {new Date(session.slot_start).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-forest/50" />
                            {new Date(session.slot_start).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/my-consultations"
                        className="px-3 py-1.5 rounded-brand border border-forest/20 text-forest text-xs font-medium hover:bg-forest/5 transition-colors whitespace-nowrap"
                      >
                        Details
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <p className="text-xs text-forest/70 font-sans">
                    You do not have any upcoming consultation sessions scheduled.
                  </p>
                  <Link
                    to="/book"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-brand bg-forest text-sand-light text-xs font-medium hover:bg-forest-light transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Sanctuary Consultation</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Explore Sanctuary Disciplines */}
            <div className="bg-sand-50 rounded-brand-lg border border-forest/15 p-6 shadow-soft">
              <h3 className="font-serif text-lg text-forest mb-4 flex items-center gap-2">
                <Compass className="w-4 h-4 text-forest/70" />
                <span>Explore The Five Sanctuary Pillars</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/services/yoga-wellness"
                  className="p-3.5 rounded-brand bg-sand border border-forest/15 hover:border-forest hover:bg-forest/5 transition-all group"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-forest/60 group-hover:text-forest">
                    Pillar 01
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-forest mt-0.5">
                    Yoga &amp; Restorative Fitness
                  </h4>
                  <p className="text-[11px] text-forest/70 mt-1 line-clamp-2">
                    Weight loss, mental wellbeing, therapeutic condition care (PCOD, diabetes, hypertension).
                  </p>
                </Link>

                <Link
                  to="/services/vastu-architecture"
                  className="p-3.5 rounded-brand bg-sand border border-forest/15 hover:border-forest hover:bg-forest/5 transition-all group"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-forest/60 group-hover:text-forest">
                    Pillar 02
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-forest mt-0.5">
                    Vastu &amp; Spatial Alignment
                  </h4>
                  <p className="text-[11px] text-forest/70 mt-1 line-clamp-2">
                    Five-element geometry and directional balancing for homes and workspaces.
                  </p>
                </Link>

                <Link
                  to="/services/astrology-cosmic"
                  className="p-3.5 rounded-brand bg-sand border border-forest/15 hover:border-forest hover:bg-forest/5 transition-all group"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-forest/60 group-hover:text-forest">
                    Pillar 03
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-forest mt-0.5">
                    Astrology &amp; Cosmic Blueprint
                  </h4>
                  <p className="text-[11px] text-forest/70 mt-1 line-clamp-2">
                    Planetary timing, natal chart analysis, and cosmic life cycle navigation.
                  </p>
                </Link>

                <Link
                  to="/services/corporate-wellbeing"
                  className="p-3.5 rounded-brand bg-sand border border-forest/15 hover:border-forest hover:bg-forest/5 transition-all group"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-forest/60 group-hover:text-forest">
                    Pillar 04
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-forest mt-0.5">
                    Corporate Wellbeing
                  </h4>
                  <p className="text-[11px] text-forest/70 mt-1 line-clamp-2">
                    Executive stress resilience, ergonomics, and workplace vitality programs.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
