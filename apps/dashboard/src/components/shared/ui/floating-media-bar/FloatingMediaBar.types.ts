export interface FloatingMediaBarProps {
  /** Title shown statically or in the marquee. */
  title?: string;
  /** Scroll the title when the playlist panel is not visible. */
  showTitleMarquee?: boolean;
  /** Player opacity in percent (100 = opaque, 66 = translucent toggle state). */
  opacityPercent: number;
  /** Whether the video is already in the playlist. */
  isInPlaylist: boolean;
  /** Accessible label/title of the minimize button. */
  minimizeTitle?: string;
  /** Accessible label/title of the close button. */
  closeTitle?: string;
}

export interface FloatingMediaBarEmits {
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
}
