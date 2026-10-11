import type { ComponentPublicInstance } from 'vue';

/** The FileInput component's exposed handle: its hidden input element ref. */
export interface FileInputRef {
  inputRef: HTMLInputElement | null;
}

export type SetFileInputRef = (
  ref: Element | ComponentPublicInstance | null,
) => void;
