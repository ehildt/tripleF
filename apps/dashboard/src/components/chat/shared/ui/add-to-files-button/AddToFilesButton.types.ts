export interface AddToFilesButtonProps {
  /** Whether the image is already registered as a conversation file: swaps
   * the icon (add → remove), the tooltip/aria label, the pressed state, and
   * the accent color. */
  active: boolean;
  /**
   * Icon-button scale: `lg` for card surfaces (gallery tiles, lightbox —
   * default), `sm` for compact chrome bars (grid tiles).
   */
  size?: 'sm' | 'lg';
}
