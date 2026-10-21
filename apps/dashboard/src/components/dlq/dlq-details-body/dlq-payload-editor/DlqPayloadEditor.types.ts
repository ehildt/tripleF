import type { DlqEntry } from '@/types/dlq-entry.model';

export interface DlqPayloadEditorProps {
  /**
   * The DLQ entry whose payload is being viewed/edited. Guaranteed non-null
   * with a payload — the parent tab branch already guards both.
   */
  entry: DlqEntry;
  /** Whether the entry may no longer be edited (immutable archive states). */
  isImmutable: boolean;
  /** Whether a back button is shown (used when embedded outside the tab panel). */
  showBack?: boolean;
  /** Whether the payload text area gets its own scroll container. */
  scrollable?: boolean;
}

export interface DlqPayloadEditorEmits {
  /** Persist the edited payload. */
  (e: 'savePayload', id: string, payload: Record<string, unknown>): void;
  /** Back navigation from an embedded view (only when `showBack`). */
  (e: 'back'): void;
}
