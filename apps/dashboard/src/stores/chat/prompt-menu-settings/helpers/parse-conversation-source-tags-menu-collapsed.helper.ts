import type { SourceTagsMenuCollapsed } from '../prompt-menu-settings.model';

/** Parse complete per-conversation menu-collapse override records. */
export function parseConversationSourceTagsMenuCollapsed(
  raw: string | null,
): Record<string, SourceTagsMenuCollapsed> {
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
    const overrides: Record<string, SourceTagsMenuCollapsed> = {};
    for (const [conversationId, value] of Object.entries(parsed)) {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        continue;
      }
      const saved = value as Record<string, unknown>;
      if (
        typeof saved.sources === 'boolean' &&
        typeof saved.view === 'boolean'
      ) {
        overrides[conversationId] = {
          sources: saved.sources,
          view: saved.view,
        };
      }
    }
    return overrides;
  } catch {
    return {};
  }
}
