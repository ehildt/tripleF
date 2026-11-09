import { DEFAULT_CHAT_ICON_VISIBILITY } from '../chat-navigation-settings.constant';
import type { ChatIconVisibility } from '../chat-navigation-settings.model';

/** Parse chat-icon preferences, retaining valid booleans over defaults. */
export function parseChatIconVisibility(
  raw: string | null,
): ChatIconVisibility {
  const visibility = { ...DEFAULT_CHAT_ICON_VISIBILITY };
  if (!raw) return visibility;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return visibility;
    }
    for (const key of Object.keys(visibility) as Array<
      keyof ChatIconVisibility
    >) {
      const saved = (parsed as Record<string, unknown>)[key];
      if (typeof saved === 'boolean') visibility[key] = saved;
    }
    return visibility;
  } catch {
    return visibility;
  }
}
