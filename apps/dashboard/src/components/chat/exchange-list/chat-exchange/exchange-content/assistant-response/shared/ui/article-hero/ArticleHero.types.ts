export interface ArticleHeroProps {
  /** The headline/title text. */
  title?: string;
  /** Optional deck/subtitle under the headline. */
  subtitle?: string;
  /** Split direction (ar2): the hero media panel sits beside the title
   * stack instead of below it. */
  split: boolean;
  /** Hero video (preferred over the image when present). */
  heroVideoUrl?: string;
  heroVideoCaption?: string;
  heroVideoTitle?: string;
  /** Hero image fallback. */
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroCaption?: string;
}
