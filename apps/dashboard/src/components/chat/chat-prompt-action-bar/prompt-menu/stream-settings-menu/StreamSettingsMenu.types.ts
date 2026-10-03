export interface StreamSettingsMenuProps {
  /** Whether the menu dropdown is open. */
  isOpen: boolean;
  /** Whether the trigger is disabled (no model selected). */
  isDisabled: boolean;
  /** Whether stream mode (word-by-word) is enabled. */
  isStreamEnabled: boolean;
  /** The new subscription event input value. */
  newEvent: string;
  /** The new subscription room/channel input value. */
  newRoomId: string;
  /** Blink state for the trigger icon (brain-blink cue when disabled). */
  blinking?: boolean;
}
