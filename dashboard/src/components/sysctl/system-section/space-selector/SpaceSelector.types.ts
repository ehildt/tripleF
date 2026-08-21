export interface SpaceSelectorProps {
  /**
   * The active space id. Empty string = default (cognition lives in the
   * memory partition), rendered as the default pseudo-option.
   */
  activeSpace: string;
  /** Previously used space ids, most-recent-first. */
  spaces: string[];
}

export interface SpaceSelectorEmits {
  /** Pick an existing space; '' when the default pseudo-option is picked. */
  (e: 'select', space: string): void;
  /** Create-and-pick a new space id typed into the search field. */
  (e: 'create', space: string): void;
  /** Drop a space id from the history list (its data is not wiped). */
  (e: 'remove', space: string): void;
}
