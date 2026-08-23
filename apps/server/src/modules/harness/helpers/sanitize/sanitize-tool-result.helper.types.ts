/** Ingested image replacement: storage URL plus stored (resized) dimensions. */
export interface IngestedReplacement {
  imageUrl: string;
  title?: string;
  width?: number;
  height?: number;
}

/** Options shared by the per-tool sanitizers. */
export interface SanitizeToolResultOptions {
  ingestedByUrl?: Map<string, IngestedReplacement>;
  /** Image/thumbnail URLs that failed live probing — blanked out in place. */
  brokenImageUrls?: Set<string>;
  /** Article/page URLs that failed live probing — their results are dropped. */
  brokenPageUrls?: Set<string>;
}
