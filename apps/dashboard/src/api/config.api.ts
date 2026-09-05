import type { SessionConfig } from '../types/session-config.model';
import { getApiUrl } from './api-url';

export async function fetchConfig(
  sessionId: string,
): Promise<SessionConfig | null> {
  const res = await fetch(getApiUrl(`/api/v1/configs/${sessionId}`));
  if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
  // A missing config is a 200 with an empty body (Fastify sends no body for
  // a null return) — treat it as "no config yet".
  const text = await res.text();
  return text ? (JSON.parse(text) as SessionConfig) : null;
}

export async function saveConfig(
  sessionId: string,
  patch: {
    selectedModel?: string;
    preprocessing?: Record<string, unknown>;
    providerOverrides?: Record<string, unknown>;
    memoryPartition?: string | null;
    memoryCognition?: string | null;
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
