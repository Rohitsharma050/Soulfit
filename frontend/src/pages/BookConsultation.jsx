import React, { useState, useEffect, useId } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { consultationService } from '../services/api';
import Container from '../components/common/Container';
import SectionHeading from '../components/common/SectionHeading';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  User,
  Heart,
  Compass,
  FileText,
  HelpCircle,
} from 'lucide-react';

export default function BookConsultation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPillar = searchParams.get('pillar') || '';

  // Multi-step state: 1: Type, 2: Date, 3: Slot, 4: Details, 5: Review, 6: Confirmed
  const [step, setStep] = useState(1);

  // Data states
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [formData, setFormData] = useState({
    phone: '',
    goals: '',
    notes: '',
  });

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [loadingStepData, setLoadingStepData] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Load consultation types on mount
  useEffect(() => {
    async function loadTypes() {
      setLoadingStepData(true);
      const res = await consultationService.getTypes();
      if (res.success && res.data) {
        setTypes(res.data);
        if (preselectedPillar) {
          const match = res.data.find(
            (t) => t.slug === preselectedPillar || t.slug.includes(preselectedPillar)
          );
          if (match) {
            setSelectedType(match);
            setStep(2);
          }
        }
      } else {
        setErrorMessage(res.error || 'Unable to load consultation offerings.');
      }
      setLoadingStepData(false);
    }
    loadTypes();
  }, [preselectedPillar]);

  // Load available dates when type changes
  useEffect(() => {
    if (!selectedType) return;
    async function loadDates() {
      setLoadingStepData(true);
      setErrorMessage('');
      const res = await consultationService.getAvailableDates({
        typeId: selectedType.id,
        month: currentMonth,
      });
      if (res.success && res.data) {
        setAvailableDates(res.data.availableDates || []);
      } else {
        setErrorMessage(res.error || 'Unable to load available dates.');
      }
      setLoadingStepData(false);
    }
    loadDates();
  }, [selectedType, currentMonth]);

  // Load available slots when date is selected
  useEffect(() => {
    if (!selectedType || !selectedDate) return;
    async function loadSlots() {
      setLoadingStepData(true);
      setErrorMessage('');
      const res = await consultationService.getAvailableSlots({
        typeId: selectedType.id,
        date: selectedDate,
      });
      if (res.success && res.data) {
        setAvailableSlots(res.data.slots || []);
        if (res.data.slots?.length === 0) {
          setErrorMessage(
            res.data.reason || 'No available slots remaining on this date. Please select another date.'
          );
        }
      } else {
        setErrorMessage(res.error || 'Unable to load time slots.');
      }
      setLoadingStepData(false);
    }
    loadSlots();
  }, [selectedType, selectedDate]);

  const handleSelectType = (type) => {
    setSelectedType(type);
    setSelectedDate('');
    setSelectedSlot(null);
    setErrorMessage('');
    setStep(2);
  };

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setErrorMessage('');
    setStep(3);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setErrorMessage('');
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setErrorMessage('');

    const res = await consultationService.book({
      typeId: selectedType.id,
      slotStart: selectedSlot.slotStart,
      goals: formData.goals.trim(),
      notes: formData.notes.trim(),
      phone: formData.phone.trim(),
      idempotencyKey,
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setConfirmedBooking(res.data);
      setStep(6);
    } else {
      if (res.status === 409) {
        setErrorMessage(
          'This slot was just reserved by another sanctuary member. Please select another time slot.'
        );
        // Step back to slot selection
        setStep(3);
        // Refresh slots
        const reload = await consultationService.getAvailableSlots({
          typeId: selectedType.id,
          date: selectedDate,
        });
        if (reload.success) setAvailableSlots(reload.data.slots || []);
      } else {
        setErrorMessage(res.error || 'Booking could not be finalized. Please try again.');
      }
    }
  };

  return (
    <div className="py-12 md:py-20 bg-sand min-h-[calc(100vh-140px)]">
      <Container size="default">
        {/* Sanctuary Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-sans font-bold tracking-widest uppercase text-forest/70 block mb-2">
            Sanctuary Scheduling
          </span>
          <h1 className="text-3xl md:text-5xl font-serif text-forest mb-3">
            Schedule Your Consultation
          </h1>
          <p className="text-sm font-sans text-forest/75 leading-relaxed">
            Reserve a dedicated session with Soulfit’s practitioners across restorative yoga therapy, spatial Vastu, cosmic astrology, and holistic wellbeing.
          </p>

          {/* Stepper Progress Bar */}
          {step < 6 && (
            <div className="mt-8 flex items-center justify-center gap-2 max-w-md mx-auto">
              {[
                { s: 1, label: 'Pillar' },
                { s: 2, label: 'Date' },
                { s: 3, label: 'Time' },
                { s: 4, label: 'Intentions' },
                { s: 5, label: 'Review' },
              ].map(({ s, label }, idx) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      disabled={s > step}
                      onClick={() => s < step && setStep(s)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all ${
                        step === s
                          ? 'bg-forest text-sand-light shadow-soft ring-2 ring-forest/30'
                          : step > s
                          ? 'bg-forest/20 text-forest cursor-pointer hover:bg-forest/30'
                          : 'bg-forest/5 text-forest/40 cursor-not-allowed'
                      }`}
                    >
                      {step > s ? '✓' : s}
                    </button>
                    <span className="text-[10px] font-sans text-forest/60 mt-1 hidden sm:block">
                      {label}
                    </span>
                  </div>
                  {idx < 4 && (
                    <div
                      className={`h-0.5 w-6 sm:w-10 transition-colors ${
                        step > s ? 'bg-forest' : 'bg-forest/15'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div
            role="alert"
            className="max-w-2xl mx-auto mb-6 p-4 rounded-brand bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* STEP 1: Select Consultation Type */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="font-serif text-xl text-forest text-center mb-6">
              Step 1: Choose Your Sanctuary Discipline
            </h2>

            {loadingStepData ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-forest animate-spin mb-3" />
                <p className="text-xs font-serif italic text-forest/70">
                  Retrieving consultation disciplines...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleSelectType(type)}
                    className="p-6 rounded-brand-lg bg-sand-50 border border-forest/15 hover:border-forest hover:bg-forest/5 text-left transition-all shadow-soft group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-forest/60">
                          {type.duration_minutes} Mins Session
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest/10 text-forest font-semibold">
                          {type.price_display || 'Complimentary'}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg text-forest group-hover:text-forest-light transition-colors mb-2">
                        {type.name}
                      </h3>
                      <p className="text-xs text-forest/75 font-sans leading-relaxed line-clamp-3">
                        {type.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-forest/10 flex items-center justify-between text-xs font-medium text-forest">
                      <span>Select &amp; View Dates</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Select Date */}
        {step === 2 && selectedType && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-forest/70 hover:text-forest transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Discipline ({selectedType.name})</span>
              </button>
            </div>

            <div className="bg-sand-50 rounded-brand-lg border border-forest/15 p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-forest/10">
                <div>
                  <h2 className="font-serif text-xl text-forest">Step 2: Select an Available Date</h2>
                  <p className="text-xs text-forest/70 font-sans mt-0.5">
                    Sessions are offered Monday through Saturday in accordance with sanctuary restorative hours.
                  </p>
                </div>
              </div>

              {loadingStepData ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-forest animate-spin mb-3" />
                  <p className="text-xs font-serif italic text-forest/70">
                    Checking calendar availability...
                  </p>
                </div>
              ) : availableDates.length === 0 ? (
                <div className="py-12 text-center text-forest/70 text-xs">
                  <p>No available dates in the current window.</p>
                  <p className="mt-2 text-forest underline cursor-pointer" onClick={() => setStep(1)}>
                    Select another discipline or contact our concierge.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <span className="text-xs font-sans font-medium text-forest/80 block">
                    Available Dates for {selectedType.name}:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableDates.map((dateStr) => {
                      const dateObj = new Date(dateStr + 'T00:00:00');
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleSelectDate(dateStr)}
                          className="p-3 rounded-brand border border-forest/20 bg-sand hover:bg-forest hover:text-sand-light transition-all text-left flex flex-col group"
                        >
                          <span className="text-[10px] font-mono uppercase tracking-wider text-forest/60 group-hover:text-sand-light/70">
                            {dayName}
                          </span>
                          <span className="text-sm font-serif font-medium text-forest group-hover:text-sand-light mt-0.5">
                            {monthName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Select Time Slot */}
        {step === 3 && selectedType && selectedDate && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-forest/70 hover:text-forest transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Date ({selectedDate})</span>
              </button>
            </div>

            <div className="bg-sand-50 rounded-brand-lg border border-forest/15 p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-forest/10">
                <div>
                  <h2 className="font-serif text-xl text-forest">Step 3: Select a Time Slot</h2>
                  <p className="text-xs text-forest/70 font-sans mt-0.5">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    &bull; {selectedType.duration_minutes} Mins
                  </p>
                </div>
              </div>

              {loadingStepData ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-forest animate-spin mb-3" />
                  <p className="text-xs font-serif italic text-forest/70">
                    Loading verified time slots...
                  </p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-12 text-center text-forest/70 text-xs space-y-3">
                  <p>All time slots for this date are fully reserved.</p>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-brand bg-forest text-sand-light text-xs font-medium hover:bg-forest-light"
                  >
                    Select Another Date
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className="p-3.5 rounded-brand border border-forest/20 bg-sand hover:bg-forest hover:text-sand-light text-left transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-forest/60 group-hover:text-sand-light" />
                        <div>
                          <span className="font-serif text-sm font-medium text-forest group-hover:text-sand-light block">
                            {slot.formattedTime}
                          </span>
                          <span className="text-[10px] text-forest/60 group-hover:text-sand-light/70 font-mono">
                            IST (Asia/Kolkata)
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-forest/40 group-hover:text-sand-light transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Intentions & Notes Form */}
        {step === 4 && selectedType && selectedSlot && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-forest/70 hover:text-forest transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Time Slot</span>
              </button>
            </div>

            <div className="bg-sand-50 rounded-brand-lg border border-forest/15 p-6 sm:p-8 shadow-soft">
              <div className="mb-6 pb-4 border-b border-forest/10">
                <h2 className="font-serif text-xl text-forest">
                  Step 4: Your Sanctuary Intentions
                </h2>
                <p className="text-xs text-forest/70 font-sans mt-0.5">
                  Share any health priorities, condition management goals (e.g., PCOD, hypertension, diabetes, prenatal/postnatal), or space details.
                </p>
              </div>

              <div className="space-y-4">
                {/* Member details banner */}
                <div className="p-3 bg-forest/5 rounded-brand border border-forest/10 flex items-center gap-3 text-xs text-forest">
                  <User className="w-4 h-4 text-forest/70 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">{user?.name}</span> ({user?.email})
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                  >
                    Contact Phone (Optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-brand bg-sand border border-forest/20 text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                {/* Goals */}
                <div>
                  <label
                    htmlFor="goals"
                    className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                  >
                    Primary Health / Wellness Goal
                  </label>
                  <textarea
                    id="goals"
                    rows={3}
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder="e.g. Relief from chronic lower back tension, managing PCOD symptoms with restorative yoga, or spatial Vastu guidance for home office."
                    className="w-full px-3.5 py-2.5 rounded-brand bg-sand border border-forest/20 text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                  >
                    Additional Notes for Practitioner (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any mobility constraints, previous injuries, or specific timings preferred."
                    className="w-full px-3.5 py-2.5 rounded-brand bg-sand border border-forest/20 text-forest placeholder:text-forest/40 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2.5 text-xs font-medium text-forest/70 hover:text-forest"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-brand bg-forest text-sand-light text-xs font-medium hover:bg-forest-light shadow-soft transition-all"
                  >
                    <span>Proceed to Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Confirm */}
        {step === 5 && selectedType && selectedSlot && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-forest/70 hover:text-forest transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit Intentions</span>
              </button>
            </div>

            <div className="bg-sand-50 rounded-brand-lg border border-forest/15 p-6 sm:p-8 shadow-soft">
              <div className="mb-6 pb-4 border-b border-forest/10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-forest/60">
                  Step 5: Final Confirmation
                </span>
                <h2 className="font-serif text-2xl text-forest mt-1">Review Booking Details</h2>
              </div>

              {/* Booking Summary Box */}
              <div className="p-5 rounded-brand bg-sand border border-forest/15 space-y-3.5 text-xs text-forest">
                <div className="flex items-start justify-between">
                  <span className="text-forest/60">Sanctuary Discipline:</span>
                  <span className="font-semibold text-right max-w-[60%]">{selectedType.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-forest/60">Scheduled Date:</span>
                  <span className="font-medium">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-forest/60">Time Slot:</span>
                  <span className="font-medium">
                    {selectedSlot.formattedTime} (IST)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-forest/60">Duration:</span>
                  <span className="font-medium">{selectedType.duration_minutes} Minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-forest/60">Fee:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedType.price_display || 'Complimentary'}
                  </span>
                </div>
                <div className="pt-2 border-t border-forest/10 flex items-center justify-between">
                  <span className="text-forest/60">Member:</span>
                  <span className="font-medium">
                    {user?.name} &bull; {user?.email}
                  </span>
                </div>
                {formData.goals && (
                  <div className="pt-2 border-t border-forest/10">
                    <span className="text-forest/60 block mb-1">Intentions:</span>
                    <p className="text-[11px] text-forest/80 italic bg-sand-50 p-2 rounded">
                      “{formData.goals}”
                    </p>
                  </div>
                )}
              </div>

              {/* Concurrency & Policy Assurance */}
              <div className="mt-6 flex items-start gap-2.5 text-[11px] text-forest/70 font-sans">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span>
                  Your session is protected with transactional row-locking to ensure exclusivity. You may cancel or reschedule up to 2 hours prior to the session from your sanctuary dashboard.
                </span>
              </div>

              {/* Submit CTA */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(4)}
                  className="px-4 py-2.5 text-xs font-medium text-forest/70 hover:text-forest"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-brand bg-forest text-sand-light text-sm font-medium hover:bg-forest-light shadow-soft transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Sanctuary Booking</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Confirmation Screen */}
        {step === 6 && confirmedBooking && (
          <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-fast">
            <div className="bg-sand-50 rounded-brand-lg border border-forest/20 p-8 shadow-elevated text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-soft">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 font-bold block mb-1">
                  Booking Confirmed
                </span>
                <h2 className="font-serif text-3xl text-forest">
                  Sanctuary Session Reserved
                </h2>
                <p className="text-xs text-forest/75 font-sans mt-2 max-w-md mx-auto leading-relaxed">
                  Your personalized consultation with The Harmony Project has been scheduled.
                </p>
              </div>

              {/* Reference Pill */}
              <div className="p-4 rounded-brand bg-sand border border-forest/15 max-w-sm mx-auto space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-forest/60 block">
                  Booking Reference
                </span>
                <span className="font-mono text-xl font-bold text-forest tracking-wider block">
                  {confirmedBooking.booking_reference}
                </span>
                <span className="text-[11px] text-forest/70 block">
                  {new Date(confirmedBooking.slot_start).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/my-consultations"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-brand bg-forest text-sand-light text-xs font-medium hover:bg-forest-light transition-colors text-center"
                >
                  View in My Consultations
                </Link>
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-brand border border-forest/20 text-forest text-xs font-medium hover:bg-forest/5 transition-colors text-center"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
