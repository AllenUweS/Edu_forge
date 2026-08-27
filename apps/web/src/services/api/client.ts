const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

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
