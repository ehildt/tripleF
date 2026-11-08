export interface MergedSourceExchanges {
  /** Origin request ids named by the merged user prompt. */
  originRequestIds: string[];
  /** Concrete exchange ids belonging to those origin requests. */
  sourceExchangeIds: string[];
}
