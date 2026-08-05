import { getApiUrl } from './api-url';

export interface PlaylistSnapshot {
  name: string;
  conversationId: string;
  videos: Array<Record<string, unknown>>;
  updatedAt?: string;
}

export async function fetchAllPlaylists(
  sessionId: string,
): Promise<PlaylistSnapshot[]> {
  const res = await fetch(getApiUrl(`/api/v1/playlists/${sessionId}`));
  if (!res.ok) throw new Error(`Failed to list playlists: ${res.status}`);
  return (await res.json()) as PlaylistSnapshot[];
}

export async function fetchPlaylists(
  sessionId: string,
  conversationId: string,
): Promise<PlaylistSnapshot[]> {
  const res = await fetch(
    getApiUrl(`/api/v1/playlists/${sessionId}/${conversationId}`),
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
    getApiUrl(`/api/v1/playlists/${sessionId}/${conversationId}/${name}`),
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
      `/api/v1/playlists/${sessionId}/${conversationId}/${name}/rename`,
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
    getApiUrl(`/api/v1/playlists/${sessionId}/${conversationId}/${name}`),
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`Failed to delete playlist: ${res.status}`);
}
