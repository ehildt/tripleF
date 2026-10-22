/**
 * Theme palettes the app can be switched between. Each key maps to a palette
 * file under `src/assets/css/palettes/` that overrides the `--color-*` tokens
 * via `[data-theme='key']`.
 */
export const THEMES = [
  { key: 'gothic', name: 'Gothic' },
  { key: 'pragmata', name: 'Pragmata' },
  { key: 'souls', name: 'Dark Souls' },
  { key: 'residentevil', name: 'Resident Evil' },
  { key: 'cyberpunk', name: 'Cyberpunk 2077' },
  { key: 'baldursgate', name: "Baldur's Gate" },
  { key: 'stellar', name: 'Stellar Blade' },
  { key: 'deathspace', name: 'Dead Space' },
  { key: 'wuchang', name: 'Wuchang' },
  { key: 'nioh', name: 'Nioh' },
] as const;

/** Palette key; derived from the THEMES list so it can never drift. */
export type ThemeName = (typeof THEMES)[number]['key'];

/** Theme a fresh install starts on. */
export const DEFAULT_THEME: ThemeName = 'stellar';

/** localStorage key the selected palette persists under. */
export const THEME_STORAGE_KEY = 'theme';

/** localStorage key the dark/light mode persists under. */
export const THEME_MODE_STORAGE_KEY = 'theme-mode';
