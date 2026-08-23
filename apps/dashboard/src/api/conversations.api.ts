import type {
  ConversationContent,
  ConversationSnapshot,
  MergedConversation,
} from '../types/conversation.model';
import { getApiUrl } from './api-url';

export async function fetchConversations(
  sessionId: string,
): Promise<ConversationSnapshot[]> {
  const res = await fetch(getApiUrl(`/api/v1/conversations/${sessionId}`));
  if (!res.ok) throw new Error(`Failed to list conversations: ${res.status}`);
  return (await res.json()) as ConversationSnapshot[];
}

export async function fetchConversation(
  sessionId: string,
  conversationId: string,
): Promise<MergedConversation | null> {
  const res = await fetch(
    getApiUrl(`/api/v1/conversations/${sessionId}/${conversationId}`),
  );
  // 404 is a definitive answer (the conversation no longer exists on the
  // server — e.g. its id was superseded by setConversationId) and lets the
  // restore flow drop a stale bookmark instead of retrying forever.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load conversation: ${res.status}`);
  return (await res.json()) as MergedConversation;
}

export async function saveConversation(
  sessionId: string,
  conversationId: string,
  requestId: string,
  content: ConversationContent,
): Promise<void> {
  const res = await fetch(
    getApiUrl(
      `/api/v1/conversations/${sessionId}/${conversationId}/${requestId}`,
    ),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  );
  if (!res.ok) throw new Error(`Failed to save conversation: ${res.status}`);
}

export async function deleteConversation(
  sessionId: string,
  conversationId: string,
): Promise<void> {
  const res = await fetch(
    getApiUrl(`/api/v1/conversations/${sessionId}/${conversationId}`),
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
}
