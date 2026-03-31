// API Configuration - resolves a safe base URL for web, mobile webviews, and Railway deployment.
export const DEFAULT_PRODUCTION_API_URL = 'https://commerce-platform-production.up.railway.app';

const LOCAL_API_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const isLocalHostname = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1';

export const resolveApiBaseUrl = () => {
  const configuredUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return configuredUrl;
  }

  const { hostname, origin, protocol } = window.location;
  const isHttpPage = protocol === 'http:' || protocol === 'https:';
  const isWebViewRuntime = !isHttpPage;
  const configuredIsLocal = LOCAL_API_HOST_PATTERN.test(configuredUrl);

  // Keep localhost on same-origin so the integrated browser and local server
  // talk to the active local instance instead of forcing production API calls.
  if (isLocalHostname(hostname)) {
    return '';
  }

  if (configuredUrl && configuredUrl === origin) {
    return '';
  }

  if (isWebViewRuntime) {
    if (configuredUrl && !configuredIsLocal) {
      return configuredUrl;
    }

    return DEFAULT_PRODUCTION_API_URL;
  }

  if (configuredUrl && !configuredIsLocal) {
    return configuredUrl;
  }

  if (configuredIsLocal) {
    return '';
  }

  if (hostname.endsWith('.vercel.app')) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  return '';
};

export const API_URL = resolveApiBaseUrl();

export const apiCall = async (path: string, options?: RequestInit) => {
  const url = API_URL ? `${API_URL}${path}` : path;
  console.log(`📡 API Call: ${url}`);
  return fetch(url, options);
};

// Export helper functions for common patterns
export const apiGet = (path: string) => {
  return apiCall(path, { method: 'GET' });
};

export const apiPost = (path: string, data: any) => {
  return apiCall(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const apiPut = (path: string, data: any) => {
  return apiCall(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const apiDelete = (path: string) => {
  return apiCall(path, { method: 'DELETE' });
};
