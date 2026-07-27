import { getApiUrl } from './api-url';

export interface SessionConfig {
  sessionId: string;
  selectedModel?: string | null;
  preprocessing?: Record<string, unknown> | null;
  providerOverrides?: Record<string, unknown> | null;
}

export async function fetchConfig(
  sessionId: string,
): Promise<SessionConfig | null> {
  const res = await fetch(getApiUrl(`/api/v1/configs/${sessionId}`));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
  return (await res.json()) as SessionConfig;
}

export async function saveConfig(
  sessionId: string,
  patch: {
    selectedModel?: string;
    preprocessing?: Record<string, unknown>;
    providerOverrides?: Record<string, unknown>;
  },
): Promise<void> {
  const res = await fetch(getApiUrl(`/api/v1/configs/${sessionId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to save config: ${res.status}`);
}

export async function deleteConfig(sessionId: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/v1/configs/${sessionId}`), {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete config: ${res.status}`);
}
