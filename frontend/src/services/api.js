import apiClient from '../config/api';

/**
 * Public Services API Client
 */
export const servicesService = {
  async getAll(params = {}) {
    try {
      const response = await apiClient.get('/services', { params });
      return { success: true, data: response.data.data, meta: response.data.meta };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to load services from sanctuary catalog.';
      return { success: false, error: message };
    }
  },

  async getBySlug(slug, options = {}) {
    try {
      const response = await apiClient.get(`/services/${slug}`, options);
      return { success: true, data: response.data.data };
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return { success: false, cancelled: true };
      }
      const message = error.response?.data?.message || error.message || 'Service not found.';
      return { success: false, error: message };
    }
  },
};

/**
 * Newsletter Subscription Service
 */
export const newsletterService = {
  async subscribe(email, consent = true) {
    try {
      const response = await apiClient.post('/newsletter/subscribe', { email, consent });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        alreadySubscribed: response.data.data?.alreadySubscribed || false,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Subscription failed. Please try again.';
      return { success: false, error: message };
    }
  },

  async unsubscribe(token) {
    try {
      const response = await apiClient.post('/newsletter/unsubscribe', { token });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unsubscribe failed.';
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
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to submit contact message. Please try again later.';
      const errors = error.response?.data?.errors || [];
      return { success: false, error: message, errors };
    }
  },
};

/**
 * Journal / Articles Service
 */
export const articleService = {
  async getAll(params = {}) {
    try {
      const response = await apiClient.get('/articles', { params });
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to load knowledge sanctuary articles.';
      return { success: false, error: message };
    }
  },

  async getBySlug(slug) {
    try {
      const response = await apiClient.get(`/articles/${slug}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Article not found.';
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

export default {
  services: servicesService,
  newsletter: newsletterService,
  contact: contactService,
  articles: articleService,
  consultation: consultationService,
};
