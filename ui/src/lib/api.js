import axios from 'axios';

export const API_BASE = 'https://api-nexus.bachdev.bond';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use(config => {
  // Read token from Zustand persisted storage or fallback to raw key
  let token = null;
  try {
    const persisted = localStorage.getItem('nexus_auth');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      token = parsed?.state?.token ?? null;
    }
  } catch {
    // ignore parse errors
  }
  // Fallback: legacy key written by old Login component
  if (!token) token = localStorage.getItem('nexus_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach CSRF token if present in cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  if (config.method !== 'get') {
    const csrf = getCookie('csrf_token');
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Prevent infinite loop when the refresh call itself fails
    if (originalRequest.url && originalRequest.url.includes('/api/auth/refresh')) {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await api.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.access_token;

        // Update Zustand persisted state
        try {
          const persisted = localStorage.getItem('nexus_auth');
          if (persisted) {
            const parsed = JSON.parse(persisted);
            if (parsed?.state) {
              parsed.state.token = newToken;
              localStorage.setItem('nexus_auth', JSON.stringify(parsed));
            }
          }
        } catch {
          // ignore
        }
        // Also keep legacy key in sync
        localStorage.setItem('nexus_token', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        // Clear all auth state and redirect
        localStorage.removeItem('nexus_auth');
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        localStorage.removeItem('nexus_id');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
