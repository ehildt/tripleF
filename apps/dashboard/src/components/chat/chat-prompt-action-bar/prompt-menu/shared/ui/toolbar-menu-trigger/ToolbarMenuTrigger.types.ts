import type { LucideIcon } from '@lucide/vue';

export interface ToolbarMenuTriggerProps {
  /** Whether the menu dropdown is open. */
  isOpen: boolean;
  /** Whether the trigger is disabled (no model selected). Default: false. */
  isDisabled?: boolean;
  /** Tooltip text for the trigger button. */
  title: string;
  /** Trigger icon (a lucide component). */
  triggerIcon: LucideIcon;
  /** CSS width for the dropdown panel. */
  dropdownWidth?: string;
}
