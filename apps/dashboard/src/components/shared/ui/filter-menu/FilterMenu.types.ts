export interface FilterMenuOption {
  /** The option's submitted value. */
  value: string;
  /** The option's display label. */
  label: string;
}

export interface FilterMenuProps {
  /** Whether the dropdown is currently open. */
  isOpen: boolean;
  /** Whether a non-default filter is applied (tints the trigger). */
  isActive: boolean;
  /** Trigger title. */
  title: string;
  /** Dropdown width. */
  width: string;
  /** The filter options. */
  options: readonly FilterMenuOption[];
  /** The currently selected value. */
  selectedValue: string;
  /** Whether the selection is a free-text value (shows the text tone). */
  hasTextValue?: boolean;
}

export interface FilterMenuEmits {
  /** The trigger toggled the dropdown. */
  toggle: [];
  /** An option was selected. */
  select: [value: string];
}
