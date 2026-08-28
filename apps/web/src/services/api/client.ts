const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes('localhost')) {
    return envUrl.trim();
  }
  return 'http://localhost:4000';
};

const API_BASE_URL = getApiBaseUrl();

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let base = API_BASE_URL.replace(/\/+$/, '');

  // Prevent duplicate /api/api if both base and endpoint contain /api
  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.replace(/^\/api/, '');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${base}${cleanEndpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const message = errData.error?.message || errData.error || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}
