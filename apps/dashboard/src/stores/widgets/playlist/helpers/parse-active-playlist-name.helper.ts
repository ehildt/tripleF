/** Parse the persisted active playlist name, using no selection when absent. */
export function parseActivePlaylistName(saved: string | null): string {
  return saved ?? '';
}
