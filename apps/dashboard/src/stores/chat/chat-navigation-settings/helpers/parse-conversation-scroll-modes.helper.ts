import type { ScrollMode } from '../chat-navigation-settings.model';

/** Parse and validate persisted per-conversation scroll-mode overrides. */
export function parseConversationScrollModes(
  raw: string | null,
): Record<string, ScrollMode> {
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
    const modes: Record<string, ScrollMode> = {};
    for (const [conversationId, mode] of Object.entries(parsed)) {
      if (mode === 'native' || mode === 'carousel') {
        modes[conversationId] = mode;
      }
    }
    return modes;
  } catch {
    return {};
  }
}
