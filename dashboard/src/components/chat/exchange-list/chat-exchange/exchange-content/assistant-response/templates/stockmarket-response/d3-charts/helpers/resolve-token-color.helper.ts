import { resolveColor } from './resolve-color.helper';

/**
 * Theme token names the model may reference for chart overlay colors. Kept to
 * the semantic tokens so overlays stay theme-consistent across palettes.
 * Ported from the lightweight-charts helper.
 */
const TOKEN_VARS: Record<string, string> = {
  'accent-primary': 'var(--color-accent-primary)',
  'accent-secondary': 'var(--color-accent-secondary)',
  'status-success': 'var(--color-status-success)',
  'status-warning': 'var(--color-status-warning)',
  'status-error': 'var(--color-status-error)',
  'status-info': 'var(--color-status-info)',
  'harmony-1': 'var(--color-harmony-1)',
  'harmony-2': 'var(--color-harmony-2)',
  'harmony-3': 'var(--color-harmony-3)',
  'harmony-4': 'var(--color-harmony-4)',
  'fg-primary': 'var(--color-fg-primary)',
  'fg-secondary': 'var(--color-fg-secondary)',
  'fg-muted': 'var(--color-fg-muted)',
};

/**
 * Resolve a theme token name (or undefined) to a concrete rgba() string for
 * SVG. Unknown or missing names fall back to the accent color.
 */
export function resolveTokenColor(
  tokenName: string | undefined,
  alpha: number,
): string {
  const varColor = tokenName ? TOKEN_VARS[tokenName] : undefined;
  return resolveColor(varColor ?? 'var(--color-accent-primary)', alpha);
}
