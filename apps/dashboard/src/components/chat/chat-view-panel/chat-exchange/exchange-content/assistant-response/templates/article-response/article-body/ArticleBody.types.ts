export interface ArticleBodyProps {
  /** Whether the lead paragraph renders above the body prose (stacked hero). */
  showLead: boolean;
  /** The article's lead/summary paragraph. */
  summary?: string;
  /** Heading for the body prose section. */
  sectionTitle?: string;
  /** Body prose content. */
  sectionContent?: string;
  /** Pull-quote text rendered below the prose. */
  quote?: string;
  /** Whether the body prose renders in two newspaper columns. */
  multicol: boolean;
}
