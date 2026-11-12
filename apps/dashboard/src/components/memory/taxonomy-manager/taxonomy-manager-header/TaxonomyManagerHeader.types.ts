export interface TaxonomyManagerHeaderProps {
  /** A fetch is in flight — the refresh action is disabled meanwhile. */
  isLoading: boolean;
  /** Whether the independent Tags content view is selected. */
  isTagsView: boolean;
}

export interface TaxonomyManagerHeaderEmits {
  /** The refresh action was clicked. */
  (e: 'refresh'): void;
  /** The Tags content selector was clicked. */
  (e: 'showTags'): void;
}
