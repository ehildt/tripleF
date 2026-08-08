export interface AnchorCandidate {
  el: HTMLElement;
  /** Scroll container the figure lives in (null = viewport scroller). */
  scrollRoot: HTMLElement | null;
  inView: boolean;
}

export type PlaybackDockMode = 'auto' | 'float-latched' | 'dock-dismissed';
