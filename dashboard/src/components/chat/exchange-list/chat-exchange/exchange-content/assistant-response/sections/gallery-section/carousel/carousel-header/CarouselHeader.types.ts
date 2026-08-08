export interface CarouselHeaderProps {
  /** Index of the currently active slide; drives the selected dot. */
  activeIndex: number;
  /** Number of slides — one dot per slide. */
  count: number;
  /** Optional heading rendered left of the dots; omitted when absent. */
  title?: string;
  /** Anchor id for the rendered title (aria-labelledby wiring). */
  titleId?: string;
}
