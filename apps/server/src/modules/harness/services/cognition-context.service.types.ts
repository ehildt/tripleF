/** Profile, recalled cognition, and graph context prepared for one respond turn. */
export interface CognitionContextResult {
  /** Serialized user-side structured profile, including optional path-derived retrieval heat. */
  profile?: string;
  /** Serialized assistant persona taught by the user. */
  persona?: string;
  /** Serialized behavioral corrections taught by the user. */
  corrections?: string;
  /** Relevant derived insights, with contested records explicitly marked. */
  insights: string[];
  /** Relevant synthesized convictions, with contested records explicitly marked. */
  convictions: string[];
  /** Recency-weighted episode texts recalled for the current prompt. */
  episodes: string[];
  /** Graph cluster summaries recalled for cross-cutting fact context. */
  clusters: string[];
}
