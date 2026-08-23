export interface MediaCardHeaderProps {
  /** Media title; renders an anchor when `url` is set, a span otherwise. */
  title?: string;
  /** Source URL the title links to (opens in a new tab). */
  url?: string;
  /** Line clamp for long titles: 1 (single-line ellipsis, default) or 2. */
  clamp?: 1 | 2;
  /** Wrap the title in a tooltip (long titles). Defaults to `false`. */
  tooltip?: boolean;
  /**
   * Drop the header row's padding. Card surfaces (video gallery, hero media)
   * keep it; the carousel's glass caption bar sets it.
   */
  flush?: boolean;
}
