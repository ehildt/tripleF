export interface ComboBoxProps {
  /** Current value (free text or a picked option). */
  modelValue: string;
  /** Existing values offered below the divider. Empty → plain input. */
  options?: readonly string[];
  /** Placeholder shown in the input and the empty trigger. */
  placeholder: string;
  /** Stable id for the field. Auto-generated if omitted. */
  id?: string;
  /** Name attribute, aids browser autofill. */
  name?: string;
  /** Vertical side the menu opens toward. `top` opens above the trigger —
   *  for fields inside a menu panel anchored at the bottom of the viewport
   *  (the chat menu in the prompt bar). */
  side?: 'top' | 'bottom';
}
