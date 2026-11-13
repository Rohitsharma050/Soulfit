import axios from 'axios';

/**
 * Centralized Axios API Client
 * Configured with environment-based base URL and credentials support for future cookie sessions.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

export default apiClient;
