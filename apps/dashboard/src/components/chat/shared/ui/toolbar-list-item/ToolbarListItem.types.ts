export interface ToolbarListItemProps {
  /** Dims the row when its subject is not the active/selected one. */
  isInactive?: boolean;
  /** Makes the whole row clickable (selects the item); false for rows whose
   *  only affordances are the action icons inside. */
  isInteractive?: boolean;
}
