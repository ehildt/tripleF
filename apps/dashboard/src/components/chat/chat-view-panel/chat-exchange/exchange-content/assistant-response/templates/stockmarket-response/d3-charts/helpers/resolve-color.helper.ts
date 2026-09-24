/**
 * Resolve a CSS color token (or any CSS color) to a concrete `rgba()` string.
 * Reads the computed `rgb()` value of the token through the browser and
 * rebuilds a plain `rgba()` string with the requested alpha, which SVG fill
 * and stroke attributes always understand. Ported from the lightweight-charts
 * helper.
 *
 * Must be called from the browser (uses the DOM), i.e. inside build/mount.
 */
const cache = new Map<string, string>();

export function resolveColor(varColor: string, alpha: number): string {
  const key = `${varColor}:${alpha}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const el = document.createElement('div');
  el.style.display = 'none';
  document.body.appendChild(el);
  el.style.color = varColor;
  const computed = window.getComputedStyle(el).color;
  document.body.removeChild(el);

  const match = computed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) {
    // Unknown/unresolvable color — fall back to a neutral gray.
    const fallback = `rgba(128, 128, 128, ${alpha})`;
    cache.set(key, fallback);
    return fallback;
  }

  const rgba = `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  cache.set(key, rgba);
  return rgba;
}
