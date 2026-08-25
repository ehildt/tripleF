const API_URL = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
const MEMORY_API_URL = import.meta.env.VITE_MEMORY_API_URL || '';

export function getApiUrl(path: string): string {
  if (!API_URL) return path;
  return `${API_URL}${path}`;
}

export function getSocketUrl(): string {
  return SOCKET_URL;
}

/**
 * The memory app's REST surface. The dashboard talks to the memory service
 * directly (no server pass-through): in dev the vite proxy routes the
 * `/memory-api` prefix to the memory app's `/api`, and in prod nginx does the
 * same. `VITE_MEMORY_API_URL` overrides the base for a cross-origin setup.
 */
export function getMemoryApiUrl(path: string): string {
  if (MEMORY_API_URL) return `${MEMORY_API_URL}${path}`;
  return path.replace(/^\/api/, '/memory-api');
}
