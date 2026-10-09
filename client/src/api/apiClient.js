const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

let authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('det_token') : null;

export function setAuthToken(token) {
  authToken = token || null;
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem('det_token', token);
  else localStorage.removeItem('det_token');
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers = {}, raw = false, signal } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      ...headers,
    },
    signal,
  };

  if (authToken) options.headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (raw) {
    if (!response.ok) {
      let message = 'Request failed';
      try {
        const data = await response.json();
        message = data?.error?.message || message;
      } catch {
        /* ignore */
      }
      throw new ApiError(message, response.status);
    }
    return response;
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.error?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload?.error?.details);
  }

  return payload?.data ?? payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  raw: (path, opts) => request(path, { ...opts, raw: true }),
};

export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export default api;
