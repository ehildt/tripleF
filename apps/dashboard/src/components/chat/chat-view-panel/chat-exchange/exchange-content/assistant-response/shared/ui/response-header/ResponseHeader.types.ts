export interface ResponseHeaderProps {
  /** The heading text. */
  title?: string;
  /** Optional muted subtitle under the heading. */
  subtitle?: string;
  /**
   * Heading scale: `sm` (1.1em — subject-profile names), `md`
   * (1.25rem — hero/quote/shop headers, default), `xl` (2rem — banner).
   */
  size?: 'sm' | 'md' | 'xl';
  /** Heading element: `h2` (default) or `h3` (sub-blocks). */
  as?: 'h2' | 'h3';
  /** Padded tertiary backdrop for hero panels. */
  panel?: boolean;
  /** Bottom hairline for sub-block headers (evaluation subject profiles). */
  ruled?: boolean;
}
