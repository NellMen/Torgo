const API_BASE = '/api';

async function request(path, options = {}) {
  const { headers = {}, body, ...rest } = options;
  const init = {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    ...rest,
  };

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    init.body = body;
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (isJson && payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'ok')) {
    if (!payload.ok) {
      const message = payload.message || payload.error || 'Request failed';
      const error = new Error(message);
      error.status = response.status;
      error.data = payload;
      throw error;
    }
    return payload.data;
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
      (typeof payload === 'string' ? payload : null) ||
      response.statusText;
    const error = new Error(message || 'Request failed');
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;
