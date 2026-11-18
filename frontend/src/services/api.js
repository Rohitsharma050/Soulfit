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
 * Consultation Booking Service (Phase 5)
 */
export const consultationService = {
  async getTypes() {
    try {
      const response = await apiClient.get('/consultations/types');
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to retrieve consultation types.';
      return { success: false, error: message };
    }
  },

  async getAvailableDates({ typeId, month, startDate, endDate, timezone = 'Asia/Kolkata' }) {
    try {
      const params = { type_id: typeId, timezone };
      if (month) params.month = month;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const response = await apiClient.get('/consultations/availability/dates', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to retrieve available dates.';
      return { success: false, error: message };
    }
  },

  async getAvailableSlots({ typeId, date, timezone = 'Asia/Kolkata' }) {
    try {
      const response = await apiClient.get('/consultations/availability', {
        params: { type_id: typeId, date, timezone },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to retrieve time slots.';
      return { success: false, error: message };
    }
  },

  async book({ typeId, slotStart, goals, notes, phone, idempotencyKey, timezone = 'Asia/Kolkata' }) {
    try {
      const response = await apiClient.post('/consultations/book', {
        type_id: typeId,
        slot_start: slotStart,
        goals,
        notes,
        phone,
        idempotency_key: idempotencyKey,
        timezone,
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Booking failed.';
      const status = error.response?.status;
      return { success: false, error: message, status };
    }
  },

  async getMyConsultations({ status = 'all', page = 1, limit = 20 } = {}) {
    try {
      const response = await apiClient.get('/consultations/my', {
        params: { status, page, limit },
      });
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to load consultations.';
      return { success: false, error: message };
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`/consultations/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Consultation not found.';
      return { success: false, error: message };
    }
  },

  async cancel(id, reason) {
    try {
      const response = await apiClient.patch(`/consultations/${id}/cancel`, { reason });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to cancel consultation.';
      return { success: false, error: message };
    }
  },

  async reschedule(id, newSlotStart, timezone = 'Asia/Kolkata') {
    try {
      const response = await apiClient.patch(`/consultations/${id}/reschedule`, {
        new_slot_start: newSlotStart,
        timezone,
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to reschedule consultation.';
      return { success: false, error: message };
    }
  },
};

/**
 * Authentication & Identity Service (Phase 4)
 */
export const authService = {
  async register({ name, email, password, confirmPassword }) {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password, confirmPassword });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed.';
      const errors = error.response?.data?.errors || [];
      return { success: false, error: message, errors };
    }
  },

  async login({ email, password, rememberMe = false }) {
    try {
      const response = await apiClient.post('/auth/login', { email, password, rememberMe });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed.';
      const errors = error.response?.data?.errors || [];
      return { success: false, error: message, errors };
    }
  },

  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      return { success: false, error: message, status: error.response?.status };
    }
  },

  async logout() {
    try {
      const response = await apiClient.post('/auth/logout');
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getGoogleAuthUrl() {
    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const cleanBase = base.trim().replace(/\/+$/, '');
    if ((cleanBase.startsWith('http://') || cleanBase.startsWith('https://')) && !cleanBase.includes('/api')) {
      return `${cleanBase}/api/v1/auth/google`;
    }
    return `${cleanBase}/auth/google`;
  },
};

export default {
  services: servicesService,
  newsletter: newsletterService,
  contact: contactService,
  articles: articleService,
  consultation: consultationService,
  auth: authService,
};
