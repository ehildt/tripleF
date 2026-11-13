export interface TaxonomyManagerHeaderProps {
  /** A fetch is in flight — the refresh action is disabled meanwhile. */
  isLoading: boolean;
  /** Whether the Partition taxonomy view is selected. */
  isPartitionView: boolean;
  /** Whether the Encyclopedia taxonomy view is selected. */
  isEncyclopediaView: boolean;
  /** Whether the independent Tags content view is selected. */
  isTagsView: boolean;
}

export interface TaxonomyManagerHeaderEmits {
  /** The refresh action was clicked. */
  (e: 'refresh'): void;
  /** The Partition taxonomy selector was clicked. */
  (e: 'showPartition'): void;
  /** The Encyclopedia taxonomy selector was clicked. */
  (e: 'showEncyclopedia'): void;
  /** The Tags content selector was clicked. */
  (e: 'showTags'): void;
}
