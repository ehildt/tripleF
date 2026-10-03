/** One record line for the friction screen — id + text (+ classified metadata + recency). */
export interface FrictionFact {
  id: string;
  text: string;
  /** ISO timestamp — helps the model prefer the newer statement on a tie. */
  createdAt?: string;
  /** The entity the record is about — conflicts require the same subject. */
  subject?: string;
  /** Broad family label — conflicts almost always live inside one family. */
  category?: string;
  /** What kind of durable thing this is (preference, state, contact, …). */
  kind?: string;
  /** Whether a newer statement is expected to replace this one. */
  stability?: string;
}
