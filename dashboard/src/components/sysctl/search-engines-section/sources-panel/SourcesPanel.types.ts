import type { SourcesConfig } from '../../sysctl-config.model';

export interface SourcesPanelProps {
  /** Preferred/blocked source lists plus the image-task reference pool size. */
  sources: SourcesConfig;
}

export type SourcesPanelPatch =
  | { key: 'preferred' | 'blocked'; value: string[] }
  | { key: 'imageTaskReferenceCount'; value: number };

export interface SourcesPanelEmits {
  patch: [payload: SourcesPanelPatch];
  reset: [key: 'preferred' | 'blocked'];
}
