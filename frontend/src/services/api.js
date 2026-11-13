import apiClient from '../config/api';

/**
 * Newsletter Subscription Service
 */
export const newsletterService = {
  async subscribe(email, consent = true) {
    try {
      const response = await apiClient.post('/newsletter/subscribe', { email, consent });
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Subscription failed. Please try again.';
      return { success: false, error: message };
    }
  },
};

/**
 * Consultation Inquiry Service (scaffold for future Phase 6 integration)
 */
export const consultationService = {
  async submitInquiry(inquiryData) {
    try {
      const response = await apiClient.post('/consultations/inquiry', inquiryData);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Consultation request submission is being connected.';
      return { success: false, error: message };
    }
  },
};

/**
 * Contact Inquiry Service
 */
export const contactService = {
  async submitMessage(contactData) {
    try {
      const response = await apiClient.post('/contact', contactData);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to submit contact message. Please try again later.';
      return { success: false, error: message };
    }
  },
};

export default {
  newsletter: newsletterService,
  consultation: consultationService,
  contact: contactService,
};
