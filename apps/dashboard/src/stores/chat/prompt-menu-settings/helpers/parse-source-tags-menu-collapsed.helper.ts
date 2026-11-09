import { DEFAULT_SOURCE_TAGS_MENU_COLLAPSED } from '../prompt-menu-settings.constant';
import type { SourceTagsMenuCollapsed } from '../prompt-menu-settings.model';

/** Parse global menu-collapse preferences over their defaults. */
export function parseSourceTagsMenuCollapsed(
  raw: string | null,
): SourceTagsMenuCollapsed {
  const collapsed = { ...DEFAULT_SOURCE_TAGS_MENU_COLLAPSED };
  if (!raw) return collapsed;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return collapsed;
    }
    const saved = parsed as Record<string, unknown>;
    if (typeof saved.sources === 'boolean') collapsed.sources = saved.sources;
    if (typeof saved.view === 'boolean') collapsed.view = saved.view;
    return collapsed;
  } catch {
    return collapsed;
  }
}
