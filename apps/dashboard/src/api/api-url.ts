const API_URL = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function getApiUrl(path: string): string {
  if (!API_URL) return path;
  return `${API_URL}${path}`;
}

export function getSocketUrl(): string {
  return SOCKET_URL;
}
