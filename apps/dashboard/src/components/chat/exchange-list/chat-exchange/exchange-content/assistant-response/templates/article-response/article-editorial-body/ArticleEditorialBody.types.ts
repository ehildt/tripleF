export interface ArticleEditorialBodyProps {
  /** The article's lead/summary paragraph. */
  summary?: string;
  /** Heading for the body prose section. */
  sectionTitle?: string;
  /** Body prose content. */
  sectionContent?: string;
  /** Pull-quote text rendered beside the prose. */
  quote?: string;
}
