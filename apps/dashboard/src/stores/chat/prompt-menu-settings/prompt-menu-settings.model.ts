/** Collapse state of the prompt bar's floating icon menus: the search-source
 * menu (orange) and the per-conversation view-toggle menu (blue). `true`
 * means the menu is collapsed to its expand arrow. */
export interface SourceTagsMenuCollapsed {
  /** Whether the sources menu is collapsed. */
  sources: boolean;
  /** Whether the view menu is collapsed. */
  view: boolean;
}

/** Whether each prompt-bar icon menu is pinned open (never collapses to its
 * arrow). When `true` the menu always shows its icons; when `false` the menu
 * is collapsible behind the expand arrow. */
export interface SourceTagsMenuAlwaysShow {
  /** Whether the sources menu always shows its icons. */
  sources: boolean;
  /** Whether the view menu always shows its icons. */
  view: boolean;
}
