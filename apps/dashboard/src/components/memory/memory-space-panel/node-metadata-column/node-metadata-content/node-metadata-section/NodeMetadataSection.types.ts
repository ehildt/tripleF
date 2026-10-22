export interface NodeMetadataSectionProps {
  /** The section's localized heading (the tag above the rows). */
  label: string;
  /** The section's rows. */
  items: readonly string[];
  /** Section chrome: warning (contested) or neutral (supporting). */
  tone: 'warning' | 'neutral';
}
