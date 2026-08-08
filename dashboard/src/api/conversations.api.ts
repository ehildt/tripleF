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
): Promise<MergedConversation> {
  const res = await fetch(
    getApiUrl(`/api/v1/conversations/${sessionId}/${conversationId}`),
  );
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
