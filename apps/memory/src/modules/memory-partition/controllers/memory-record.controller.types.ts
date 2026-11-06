export interface MemoryTextStoreResult {
  /** Whether the background memory store accepted the record. */
  accepted: boolean;
  /** Deterministic id of the stored record when the write succeeded. */
  id?: string;
}
