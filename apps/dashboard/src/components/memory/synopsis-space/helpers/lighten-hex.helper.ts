/**
 * Lighten a `#rrggbb` color toward white by `amount` (0–1) — the synopsis
 * canvas's per-level tint ladder, derived from the theme accent so the tree
 * follows the active palette.
 */
export function lightenHex(hex: string, amount: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  const channel = (shift: number) => {
    const base = (value >> shift) & 0xff;
    return Math.round(base + (255 - base) * Math.min(Math.max(amount, 0), 1));
  };
  const toHex = (channelValue: number) =>
    channelValue.toString(16).padStart(2, '0');
  return `#${toHex(channel(16))}${toHex(channel(8))}${toHex(channel(0))}`;
}
