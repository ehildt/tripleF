export interface PlaylistSnapshot {
  name: string;
  videos: Array<Record<string, unknown>>;
  updatedAt?: string;
}
