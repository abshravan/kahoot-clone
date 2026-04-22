import { API_URL } from './env';

export type ApiError = { error: unknown };

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      typeof (data as ApiError | null)?.error === 'string'
        ? ((data as ApiError).error as string)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  get: <T,>(path: string, token?: string | null) =>
    request<T>(path, { method: 'GET', token }),
  post: <T,>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),
  put: <T,>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),
  delete: <T,>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE', token }),
};
