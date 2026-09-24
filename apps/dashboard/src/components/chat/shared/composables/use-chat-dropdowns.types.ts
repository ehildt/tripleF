import type { ComponentPublicInstance } from 'vue';

export interface DropdownRef {
  close: () => void;
}

export type SetDropdownRef = (
  ref: Element | ComponentPublicInstance | null,
) => void;
