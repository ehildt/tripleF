export interface TaxonomyItemIconPickerProps {
  /** Curated allowlist icon names for the picker grid. */
  iconNames: readonly string[];
  /** The currently selected icon name, or null when none is set. */
  selectedIcon: string | null;
  /** Select (name) or clear (null) the curated icon. */
  onSelect: (icon: string | null) => void;
}
