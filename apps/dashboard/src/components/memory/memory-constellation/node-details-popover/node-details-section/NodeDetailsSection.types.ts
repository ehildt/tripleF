export interface NodeDetailsSectionProps {
  /** Section heading shown above the rows. */
  label: string;
  /** Plain-text rows belonging to the section. */
  items: string[];
  /** Visual treatment: warning for frictions, neutral for evidence. */
  tone: 'warning' | 'neutral';
}
