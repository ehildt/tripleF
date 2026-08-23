export interface AnchorCandidate {
  el: HTMLElement;
  /** Scroll container the figure lives in (null = viewport scroller). */
  scrollRoot: HTMLElement | null;
  inView: boolean;
  /** Extra condition the candidate must satisfy to count as dockable (e.g.
   * a carousel slide being the centered one). Read reactively by the
   * visible-anchor computed, so flipping it pops the player out/in. */
  dockCondition?: () => boolean;
}

export type PlaybackDockMode = 'auto' | 'float-latched' | 'dock-dismissed';
