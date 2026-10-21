import type { Component } from 'vue';

export interface DlqMetadataFieldProps {
  /** Lucide (or any) component rendered before the label. */
  icon: Component;
  /** Short uppercase field label. */
  label: string;
  /** Pre-formatted field value. */
  value: string;
}
