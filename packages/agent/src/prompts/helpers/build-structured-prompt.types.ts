/**
 * Prose template for a structured-output prompt: the rendered JSON shape of
 * the schema is injected between `before` and `after`, so prompt and
 * validator share one source of truth.
 */
export interface StructuredPromptTemplate {
  /** Prose emitted before the rendered JSON shape. */
  before: string;
  /** Prose emitted after the rendered JSON shape. */
  after: string;
}
