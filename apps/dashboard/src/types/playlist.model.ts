export interface PlaylistSnapshot {
  name: string;
  conversationId: string;
  videos: Array<Record<string, unknown>>;
  updatedAt?: string;
}
