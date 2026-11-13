const INVALID_FILE_NAME_CHARACTERS = /[<>:"/\\|?*]/g;
const WINDOWS_RESERVED_FILE_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** Build a cross-platform JSON filename while retaining the playlist name when possible. */
export function toPlaylistFileName(playlistName: string): string {
  const replaced = playlistName
    .trim()
    .replace(INVALID_FILE_NAME_CHARACTERS, '_');
  let sanitized = Array.from(replaced, (character) =>
    character.charCodeAt(0) < 32 ? '_' : character,
  ).join('');
  while (sanitized.endsWith('.') || sanitized.endsWith(' ')) {
    sanitized = sanitized.slice(0, -1);
  }

  const withFallback = sanitized || 'playlist';
  const safeName = WINDOWS_RESERVED_FILE_NAME.test(withFallback)
    ? `_${withFallback}`
    : withFallback;
  return `${safeName}.json`;
}
