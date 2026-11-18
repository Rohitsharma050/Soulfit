import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { consultationService } from '../services/api';
import Container from '../components/common/Container';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Plus,
  Loader2,
  FileText,
  User,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function MyConsultations() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'all'
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cancel Modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule Modal state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDates, setRescheduleDates] = useState([]);
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState(null);
  const [loadingReschedule, setLoadingReschedule] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    const res = await consultationService.getMyConsultations({ status: activeTab });
    if (res.success && res.data) {
      setConsultations(res.data);
    } else {
      setErrorMessage(res.error || 'Unable to retrieve consultations.');
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Cancel handler
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setErrorMessage('');

    const res = await consultationService.cancel(cancelTarget.id, cancelReason);
    setCancelling(false);

    if (res.success) {
      setSuccessMessage(`Booking ${cancelTarget.booking_reference} has been cancelled.`);
      setCancelTarget(null);
      setCancelReason('');
      fetchConsultations();
    } else {
      setErrorMessage(res.error || 'Failed to cancel consultation.');
    }
  };

  // Open Reschedule Modal & load available dates
  const handleOpenReschedule = async (booking) => {
    setRescheduleTarget(booking);
    setRescheduleSelectedDate('');
    setRescheduleSelectedSlot(null);
    setRescheduleSlots([]);
    setLoadingReschedule(true);

    const res = await consultationService.getAvailableDates({
      typeId: booking.consultation_type_id,
    });
    if (res.success && res.data) {
      setRescheduleDates(res.data.availableDates || []);
    }
    setLoadingReschedule(false);
  };

  // When a date is clicked in Reschedule modal
  const handleSelectRescheduleDate = async (dateStr) => {
    setRescheduleSelectedDate(dateStr);
    setRescheduleSelectedSlot(null);
    setLoadingReschedule(true);

    const res = await consultationService.getAvailableSlots({
      typeId: rescheduleTarget.consultation_type_id,
      date: dateStr,
    });
    if (res.success && res.data) {
      setRescheduleSlots(res.data.slots || []);
    }
    setLoadingReschedule(false);
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget || !rescheduleSelectedSlot) return;
    setRescheduling(true);
    setErrorMessage('');

    const res = await consultationService.reschedule(
      rescheduleTarget.id,
      rescheduleSelectedSlot.slotStart
    );
    setRescheduling(false);

    if (res.success) {
      setSuccessMessage(
        `Consultation ${rescheduleTarget.booking_reference} rescheduled to ${rescheduleSelectedSlot.formattedTime}.`
      );
      setRescheduleTarget(null);
      fetchConsultations();
    } else {
      setErrorMessage(res.error || 'Failed to reschedule consultation.');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeRange = (startIso, endIso) => {
    if (!startIso) return '';
    const start = new Date(startIso);
    const end = endIso ? new Date(endIso) : null;
    const sStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const eStr = end
      ? end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : '';
    return eStr ? `${sStr} - ${eStr}` : sStr;
  };

  return (
    <div className="py-12 md:py-20 bg-sand min-h-[calc(100vh-140px)]">
      <Container size="default">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-forest/15">
          <div>
            <span className="text-[11px] font-sans font-bold tracking-widest uppercase text-forest/70 block mb-1">
              Member Sanctuary Space
            </span>
            <h1 className="text-3xl md:text-4xl font-serif text-forest">
              My Consultations
            </h1>
            <p className="text-xs sm:text-sm text-forest/75 font-sans mt-1">
              Manage your restorative yoga therapy sessions, Vastu spatial assessments, and holistic health appointments.
            </p>
          </div>

          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-brand bg-forest text-sand-light text-xs font-medium hover:bg-forest-light shadow-soft transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Session</span>
          </Link>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div
            role="status"
            className="mt-6 p-4 rounded-brand bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 p-4 rounded-brand bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between animate-in fade-in"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-red-700 hover:text-red-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Filters */}
        <div className="mt-8 flex items-center gap-2 border-b border-forest/10 pb-3">
          {[
            { id: 'upcoming', label: 'Upcoming Sessions' },
            { id: 'past', label: 'Past & Cancelled' },
            { id: 'all', label: 'All History' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium rounded-brand transition-all ${
                activeTab === tab.id
                  ? 'bg-forest text-sand-light shadow-soft'
                  : 'text-forest/70 hover:text-forest hover:bg-forest/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="mt-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-forest animate-spin mb-3" />
              <p className="text-xs font-serif italic text-forest/70">
                Retrieving your sanctuary appointments...
              </p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="bg-sand-50 rounded-brand-lg border border-forest/15 p-12 text-center max-w-lg mx-auto space-y-4 my-8">
              <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg text-forest">No Consultations Found</h3>
              <p className="text-xs text-forest/70 leading-relaxed font-sans">
                {activeTab === 'upcoming'
                  ? 'You have no upcoming sessions scheduled. When you are ready, our experienced instructors and practitioners are here to guide you.'
                  : 'No past consultations recorded for this account.'}
              </p>
              {activeTab === 'upcoming' && (
                <Link
                  to="/book"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-brand bg-forest text-sand-light text-xs font-medium hover:bg-forest-light shadow-soft transition-colors mt-2"
                >
                  <span>Schedule Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultations.map((booking) => {
                const isUpcoming =
                  ['CONFIRMED', 'PENDING'].includes(booking.status) &&
                  new Date(booking.slot_start) >= new Date();

                return (
                  <div
                    key={booking.id}
                    className="p-6 rounded-brand-lg bg-sand-50 border border-forest/15 shadow-soft flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Meta Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="font-mono text-[11px] font-bold text-forest bg-forest/10 px-2.5 py-0.5 rounded tracking-wider">
                          {booking.booking_reference || 'HP-SESSION'}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : booking.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : booking.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-lg text-forest mb-2">
                        {booking.type_name || booking.pillar_interest}
                      </h3>

                      {/* Date & Time */}
                      <div className="space-y-1.5 text-xs text-forest/80 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-forest/60" />
                          <span className="font-medium">{formatDate(booking.slot_start)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-forest/60" />
                          <span>{formatTimeRange(booking.slot_start, booking.slot_end)} (IST)</span>
                        </div>
                      </div>

                      {/* Goals / Notes */}
                      {booking.goals && (
                        <div className="p-3 bg-sand rounded border border-forest/10 text-[11px] text-forest/80 mb-4">
                          <span className="font-medium text-forest block mb-0.5">Intentions:</span>
                          <p className="line-clamp-2 italic">“{booking.goals}”</p>
                        </div>
                      )}

                      {/* Cancellation Reason if cancelled */}
                      {booking.status === 'CANCELLED' && booking.cancellation_reason && (
                        <div className="p-2.5 bg-red-50/60 rounded border border-red-200 text-[11px] text-red-800 mb-4">
                          <span className="font-semibold">Reason:</span> {booking.cancellation_reason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Upcoming Bookings */}
                    {isUpcoming && (
                      <div className="pt-4 border-t border-forest/10 flex items-center justify-end gap-2.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setCancelTarget(booking)}
                          className="px-3 py-1.5 rounded-brand border border-red-300 text-red-700 hover:bg-red-50 transition-colors text-xs font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(booking)}
                          className="px-3 py-1.5 rounded-brand bg-forest text-sand-light hover:bg-forest-light transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reschedule</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CANCEL MODAL */}
        {cancelTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-sand-50 rounded-brand-lg border border-forest/20 shadow-elevated max-w-md w-full p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-forest">Cancel Consultation</h3>
                    <span className="font-mono text-[10px] text-forest/60">
                      Ref: {cancelTarget.booking_reference}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="text-forest/60 hover:text-forest p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-forest/75 font-sans leading-relaxed mb-4">
                Are you sure you wish to cancel your scheduled session for{' '}
                <span className="font-semibold text-forest">
                  {formatDate(cancelTarget.slot_start)} at{' '}
                  {formatTimeRange(cancelTarget.slot_start, cancelTarget.slot_end)}
                </span>
                ? This slot will be released back to the sanctuary schedule.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="cancelReason"
                  className="block text-xs font-sans font-medium text-forest/80 mb-1.5"
                >
                  Reason for cancellation (Optional)
                </label>
                <textarea
                  id="cancelReason"
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, unwell, travel"
                  className="w-full p-2.5 rounded-brand bg-sand border border-forest/20 text-forest placeholder:text-forest/40 text-xs focus:outline-none focus:ring-2 focus:ring-forest/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setCancelTarget(null)}
                  className="px-4 py-2 text-xs rounded-brand border border-forest/20 text-forest hover:bg-forest/5"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 text-xs rounded-brand bg-red-600 text-white hover:bg-red-700 transition-colors inline-flex items-center gap-1.5"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESCHEDULE MODAL */}
        {rescheduleTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-sand-50 rounded-brand-lg border border-forest/20 shadow-elevated max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-forest/10">
                <div>
                  <h3 className="font-serif text-lg text-forest">Reschedule Consultation</h3>
                  <span className="font-mono text-[10px] text-forest/60">
                    Ref: {rescheduleTarget.booking_reference} &bull;{' '}
                    {rescheduleTarget.type_name || rescheduleTarget.pillar_interest}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="text-forest/60 hover:text-forest p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingReschedule ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-forest animate-spin mb-2" />
                  <p className="text-xs font-serif italic text-forest/70">
                    Checking sanctuary schedule...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select New Date */}
                  <div>
                    <span className="block text-xs font-sans font-medium text-forest/80 mb-2">
                      1. Choose a New Date:
                    </span>
                    <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                      {rescheduleDates.map((dateStr) => {
                        const dateObj = new Date(dateStr + 'T00:00:00');
                        const isSelected = rescheduleSelectedDate === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleSelectRescheduleDate(dateStr)}
                            className={`p-2 rounded text-center text-xs border transition-colors ${
                              isSelected
                                ? 'bg-forest text-sand-light border-forest'
                                : 'bg-sand border-forest/15 text-forest hover:bg-forest/5'
                            }`}
                          >
                            <span className="block text-[10px] uppercase font-mono">
                              {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="font-serif font-medium">
                              {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select New Time Slot */}
                  {rescheduleSelectedDate && (
                    <div>
                      <span className="block text-xs font-sans font-medium text-forest/80 mb-2">
                        2. Choose Available Time Slot:
                      </span>
                      {rescheduleSlots.length === 0 ? (
                        <p className="text-xs text-forest/60 italic">
                          No slots available on this date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                          {rescheduleSlots.map((slot) => {
                            const isSelected = rescheduleSelectedSlot?.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setRescheduleSelectedSlot(slot)}
                                className={`p-2 rounded text-left text-xs border transition-colors ${
                                  isSelected
                                    ? 'bg-forest text-sand-light border-forest'
                                    : 'bg-sand border-forest/15 text-forest hover:bg-forest/5'
                                }`}
                              >
                                <span className="font-serif font-medium block">
                                  {slot.formattedTime}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-forest/10 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      disabled={rescheduling}
                      onClick={() => setRescheduleTarget(null)}
                      className="px-4 py-2 text-xs rounded-brand border border-forest/20 text-forest hover:bg-forest/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={rescheduling || !rescheduleSelectedSlot}
                      onClick={handleConfirmReschedule}
                      className="px-5 py-2 text-xs rounded-brand bg-forest text-sand-light hover:bg-forest-light transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {rescheduling ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Rescheduling...</span>
                        </>
                      ) : (
                        <span>Confirm Reschedule</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
