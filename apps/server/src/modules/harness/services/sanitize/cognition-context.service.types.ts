export interface SanitizeCognitionContextResult {
  /** Serialized user-side cognition profile. */
  profile?: string;
  /** Serialized AI persona from the cognition profile. */
  persona?: string;
  /** Serialized learned corrections from the cognition profile. */
  corrections?: string;
  /** Prompt-matched insights about the user. */
  insights: string[];
  /** Prompt-matched synthesized convictions. */
  convictions: string[];
  /** Recency-blended episode memories related to the prompt. */
  episodes: string[];
  /** Cluster summaries related to the recalled facts. */
  clusters: string[];
}
