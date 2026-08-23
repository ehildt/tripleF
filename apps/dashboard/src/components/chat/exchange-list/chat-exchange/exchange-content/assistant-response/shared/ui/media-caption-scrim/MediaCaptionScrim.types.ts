/** Props for {@link MediaCaptionScrim}. */
export interface MediaCaptionScrimProps {
  /** Root tag: `figcaption` inside figures (image slides), `div` elsewhere. */
  as?: 'div' | 'figcaption';
  /** Anchor edge: `bottom` (default) fades upward; `top` keeps the content
   *  pinned to the media's top corner and fades downward. */
  edge?: 'bottom' | 'top';
}
