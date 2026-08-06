import { getApiUrl } from './api-url';

export interface PlaylistSnapshot {
  name: string;
  conversationId: string;
  videos: Array<Record<string, unknown>>;
  updatedAt?: string;
}

/**
 * Playlist names are user input (spaces, slashes, #, ?, …) but live in the
 * URL path. Always encode each segment so a name never shifts the route or
 * gets truncated by the fragment/query parsing.
 */
function encodeSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export async function fetchAllPlaylists(
  sessionId: string,
): Promise<PlaylistSnapshot[]> {
  const res = await fetch(
    getApiUrl(`/api/v1/playlists/${encodeSegment(sessionId)}`),
  );
  if (!res.ok) throw new Error(`Failed to list playlists: ${res.status}`);
  return (await res.json()) as PlaylistSnapshot[];
}

export async function fetchPlaylists(
  sessionId: string,
  conversationId: string,
): Promise<PlaylistSnapshot[]> {
  const res = await fetch(
    getApiUrl(
      `/api/v1/playlists/${encodeSegment(sessionId)}/${encodeSegment(conversationId)}`,
    ),
  );
  if (!res.ok) throw new Error(`Failed to list playlists: ${res.status}`);
  return (await res.json()) as PlaylistSnapshot[];
}

export async function savePlaylist(
  sessionId: string,
  conversationId: string,
  name: string,
  videos: Array<Record<string, unknown>>,
): Promise<void> {
  const res = await fetch(
    getApiUrl(
      `/api/v1/playlists/${encodeSegment(sessionId)}/${encodeSegment(conversationId)}/${encodeSegment(name)}`,
    ),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos }),
    },
  );
  if (!res.ok) throw new Error(`Failed to save playlist: ${res.status}`);
}

export async function renamePlaylist(
  sessionId: string,
  conversationId: string,
  name: string,
  newName: string,
): Promise<void> {
  const res = await fetch(
    getApiUrl(
      `/api/v1/playlists/${encodeSegment(sessionId)}/${encodeSegment(conversationId)}/${encodeSegment(name)}/rename`,
    ),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    },
  );
  if (!res.ok) throw new Error(`Failed to rename playlist: ${res.status}`);
}

export async function deletePlaylist(
  sessionId: string,
  conversationId: string,
  name: string,
): Promise<void> {
  const res = await fetch(
    getApiUrl(
      `/api/v1/playlists/${encodeSegment(sessionId)}/${encodeSegment(conversationId)}/${encodeSegment(name)}`,
    ),
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`Failed to delete playlist: ${res.status}`);
}
