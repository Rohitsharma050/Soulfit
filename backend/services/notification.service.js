/**
 * Sanctuary Notification Service Abstraction (Phase 5)
 * Dispatches consultation booking confirmations, cancellation notices, and rescheduling receipts.
 * Designed with provider-independence: supports development preview logging and can bind to SMTP/Resend/SendGrid.
 */

export class NotificationService {
  constructor(emailProvider = null) {
    this.emailProvider = emailProvider;
  }

  /**
   * Dispatches a booking confirmation notification.
   * Safe and non-blocking: errors are logged and never abort an already committed database transaction.
   */
  async sendBookingConfirmation({ user, consultation, consultationType }) {
    try {
      const recipientEmail = consultation.email || user.email;
      const recipientName = consultation.full_name || user.name;
      const ref = consultation.booking_reference;
      const dateFormatted = new Date(consultation.slot_start).toLocaleString('en-US', {
        timeZone: consultation.timezone || 'Asia/Kolkata',
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const subject = `[The Harmony Project] Consultation Confirmed: ${consultationType?.name || 'Sanctuary Session'} (${ref})`;

      if (this.emailProvider) {
        await this.emailProvider.sendEmail({
          to: recipientEmail,
          subject,
          text: `Dear ${recipientName},\n\nYour sanctuary consultation has been confirmed.\n\nType: ${consultationType?.name}\nBooking Reference: ${ref}\nScheduled Time: ${dateFormatted} (${consultation.timezone || 'Asia/Kolkata'})\n\nWith peace and harmony,\nThe Harmony Project Concierge`,
        });
        return { sent: true, provider: 'custom' };
      }

      // Safe development preview logging (no credentials or tokens leaked)
      console.log(`[NOTIFICATION PREVIEW] Booking Confirmation -> ${recipientEmail} | Ref: ${ref} | Time: ${dateFormatted}`);
      return { sent: true, provider: 'preview-log' };
    } catch (err) {
      console.error('[NOTIFICATION WARNING] Failed to deliver booking confirmation:', err.message);
      return { sent: false, error: err.message };
    }
  }

  /**
   * Dispatches cancellation notice.
   */
  async sendCancellationNotice({ user, consultation, reason }) {
    try {
      const recipientEmail = consultation.email || user?.email;
      const ref = consultation.booking_reference;
      console.log(`[NOTIFICATION PREVIEW] Cancellation Notice -> ${recipientEmail} | Ref: ${ref} | Reason: ${reason || 'N/A'}`);
      return { sent: true, provider: 'preview-log' };
    } catch (err) {
      console.error('[NOTIFICATION WARNING] Failed to deliver cancellation notice:', err.message);
      return { sent: false, error: err.message };
    }
  }

  /**
   * Dispatches rescheduling notice.
   */
  async sendRescheduleNotice({ user, consultation, oldSlot, newSlot }) {
    try {
      const recipientEmail = consultation.email || user?.email;
      const ref = consultation.booking_reference;
      console.log(`[NOTIFICATION PREVIEW] Reschedule Notice -> ${recipientEmail} | Ref: ${ref} | New Time: ${newSlot}`);
      return { sent: true, provider: 'preview-log' };
    } catch (err) {
      console.error('[NOTIFICATION WARNING] Failed to deliver reschedule notice:', err.message);
      return { sent: false, error: err.message };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
