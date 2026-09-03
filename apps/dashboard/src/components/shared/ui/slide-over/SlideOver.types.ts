export interface SlideOverProps {
  /** Visibility flag. The parent flips it; the panel transitions in/out. */
  open: boolean;
  /** Title rendered in the header and wired to `aria-labelledby`. */
  title: string;
  /** Tooltip/aria-label for the header close button. */
  closeTitle?: string;
}
