import type { ResizeDirection } from '@/types/resize-direction.model';

export interface FloatingPopoutProps {
  /** Title shown statically or in the marquee. */
  title?: string;
  /** Scroll the title when the playlist panel is not visible. */
  showTitleMarquee?: boolean;
  /** Media opacity in percent (25–100). */
  opacityPercent: number;
  /** Whether the media is already in the playlist. */
  isInPlaylist: boolean;
  /** Accessible label/title of the minimize button. */
  minimizeTitle?: string;
  /** Accessible label/title of the close button. */
  closeTitle?: string;
  /**
   * Bare mode: hide the bar and resize grid and strip the popup frame, so
   * the same media stays mounted while the window "docks" inline over its
   * source. The consumer positions/sizes it via the root style.
   */
  docked?: boolean;
  /**
   * Keep the media bar always visible (default). When false, the bar is
   * hidden until the popup is hovered — it fades in on mouse enter and out
   * on mouse leave, letting the media fill the freed space.
   */
  barAlwaysVisible?: boolean;
}

export interface FloatingPopoutEmits {
  /** Pointer down on free bar space starts dragging the popup. */
  drag: [event: PointerEvent];
  /** Opacity slider input (percent). */
  opacityInput: [percent: number];
  /** Toggle playlist membership of the playing video. */
  togglePlaylist: [];
  /** Dock the popup (playback keeps running). */
  minimize: [];
  /** Stop playback and close the popup. */
  close: [];
  /** A resize-handle drag started. */
  resize: [direction: ResizeDirection, event: PointerEvent];
}
