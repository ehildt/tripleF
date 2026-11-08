export interface AssistantCompletionTokenData {
  /** Cumulative prompt tokens reported by the completed harness response. */
  promptEvalCount?: number;
  /** Response tokens reported by the completed harness response. */
  evalCount?: number;
}
