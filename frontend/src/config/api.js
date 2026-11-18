import axios from 'axios';

/**
 * Centralized Axios API Client
 * Configured with environment-based base URL and credentials support for future cookie sessions.
 */
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api/v1';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  // If an absolute origin like http://localhost:5000 is supplied without path, append /api/v1
  if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('/api')) {
    return `${trimmed}/api/v1`;
  }
  return trimmed;
};

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

export default apiClient;
