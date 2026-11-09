/** Partial mirror of the dashboard playlist API snapshot. */
export interface PlaylistSnapshot {
  /** Server-persisted playlist identity. */
  name: string;
  /** Untrusted persisted queue data validated at the UI boundary. */
  videos: unknown;
  /** Optional server timestamp not consumed by playlist views. */
  updatedAt?: string;
}
