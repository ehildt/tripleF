import { DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW } from '../prompt-menu-settings.constant';
import type { SourceTagsMenuAlwaysShow } from '../prompt-menu-settings.model';

/** Parse global always-show preferences over their defaults. */
export function parseSourceTagsMenuAlwaysShow(
  raw: string | null,
): SourceTagsMenuAlwaysShow {
  const alwaysShow = { ...DEFAULT_SOURCE_TAGS_MENU_ALWAYS_SHOW };
  if (!raw) return alwaysShow;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return alwaysShow;
    }
    const saved = parsed as Record<string, unknown>;
    if (typeof saved.sources === 'boolean') alwaysShow.sources = saved.sources;
    if (typeof saved.view === 'boolean') alwaysShow.view = saved.view;
    return alwaysShow;
  } catch {
    return alwaysShow;
  }
}
