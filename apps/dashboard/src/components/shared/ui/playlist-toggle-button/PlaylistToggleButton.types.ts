export interface PlaylistToggleButtonProps {
  /** Whether the video is already in the active playlist: swaps the icon
   * (add → remove), the tooltip/aria label, the pressed state, and the
   * accent color. */
  active: boolean;
  /**
   * Icon-button scale: `lg` for card surfaces (video gallery, carousel,
   * hero media — default), `sm` for compact chrome bars (floating media
   * bar).
   */
  size?: 'sm' | 'lg';
}
