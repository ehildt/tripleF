const accentColors = {
  border: 'border-accent-primary/30',
  text: 'text-accent-primary',
  gradient: 'from-accent-primary/20 via-accent-primary/5 to-transparent',
} as const;

export function getDetailFieldColors(): typeof accentColors {
  return accentColors;
}
