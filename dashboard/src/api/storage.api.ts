import { getApiUrl } from './api-url';

export async function checkObjectExists(
  sessionId: string,
  conversationId: string,
  hash: string,
): Promise<boolean> {
  const res = await fetch(
    getApiUrl(`/api/v1/storage/${sessionId}/${conversationId}/${hash}/exists`),
  );
  if (!res.ok) return false;
  const body = (await res.json()) as { exists?: boolean };
  return body.exists === true;
}

export async function deleteUploadedObject(
  sessionId: string,
  conversationId: string,
  hash: string,
): Promise<void> {
  const res = await fetch(
    getApiUrl(`/api/v1/storage/${sessionId}/${conversationId}/${hash}`),
    {
      method: 'DELETE',
    },
  );
  if (!res.ok) throw new Error('Failed to delete uploaded object');
}
