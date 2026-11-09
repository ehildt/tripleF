import type { MediaPriority } from '@/types/assistant-response-data.model';

/** Parse valid per-conversation media-priority overrides. */
export function parseConversationMediaPriorities(
  raw: string | null,
): Record<string, MediaPriority> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const priorities: Record<string, MediaPriority> = {};
    for (const [conversationId, priority] of Object.entries(parsed)) {
      if (priority === 'images' || priority === 'videos') {
        priorities[conversationId] = priority;
      }
    }
    return priorities;
  } catch {
    return {};
  }
}
