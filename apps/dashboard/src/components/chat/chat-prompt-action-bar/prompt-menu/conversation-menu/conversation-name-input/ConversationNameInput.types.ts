/**
 * Props for the conversation name field. The field's value is the
 * component's `v-model` (declared with `defineModel` in the component), so it
 * is not part of this interface.
 */
export interface ConversationNameInputProps {
  /** Placeholder text shown while the input is empty. */
  placeholder: string;
}
