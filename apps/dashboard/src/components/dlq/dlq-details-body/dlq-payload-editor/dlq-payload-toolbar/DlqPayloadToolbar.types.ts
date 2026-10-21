export interface DlqPayloadToolbarProps {
  /** Whether a back button is shown (used when embedded outside the tab panel). */
  showBack: boolean;
  /** Whether the entry may no longer be edited (immutable archive states). */
  isImmutable: boolean;
  /** Whether the payload is being edited — toggles save/cancel vs. edit. */
  isEditingPayload: boolean;
}

export interface DlqPayloadToolbarEmits {
  /** Back navigation (only when `showBack`). */
  (e: 'back'): void;
  /** Enter edit mode. */
  (e: 'edit'): void;
  /** Confirm the current edit. */
  (e: 'save'): void;
  /** Abort the current edit. */
  (e: 'cancel'): void;
}
