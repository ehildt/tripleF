export interface EyebrowTitleProps {
  /** The eyebrow text (already translated by the caller). */
  title: string;
  /** Semantic tint for pros/cons lists. Defaults to `muted`. */
  tone?: 'muted' | 'success' | 'error';
  /** Bottom hairline under the eyebrow (pros/cons columns). */
  ruled?: boolean;
}
