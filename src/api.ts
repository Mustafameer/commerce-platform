// API Configuration - Uses environment variable or falls back to relative paths
const API_URL = import.meta.env.VITE_API_URL || '';

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
