export interface DlqErrorSectionProps {
  /** Human-readable failure reason derived from the entry's failedReason. */
  failureText: string | null;
  /** Full formatted failure detail (Zod / AI-SDK validation objects), when present. */
  failureRaw: string | null;
}
