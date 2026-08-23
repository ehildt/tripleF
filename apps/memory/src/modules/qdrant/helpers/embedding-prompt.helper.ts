import type {
  EmbeddingPromptFormat,
  EmbeddingRole,
} from '../models/embedding.model.js';

/**
 * Task-prefix formats for instruction-tuned embedding model families, taken
 * from each model's card. Ollama model names are free-form (tags, community
 * uploads like `toshk0/nomic-embed-text-v2-moe:Q6_K`), so families are matched
 * by a case-insensitive substring of the name.
 *
 * Unknown models are deliberately NOT prefixed: inventing a format for a model
 * we have not verified would poison the vector space silently, which is worse
 * than sending raw text. Add new families here as they are adopted and their
 * prompt format verified against the model card.
 */
export const EMBEDDING_PROMPT_FORMATS: readonly EmbeddingPromptFormat[] = [
  {
    family: 'embeddinggemma',
    queryPrefix: 'task: search result | query: ',
    documentPrefix: 'title: none | text: ',
  },
  {
    family: 'nomic',
    queryPrefix: 'search_query: ',
    documentPrefix: 'search_document: ',
  },
];

/** Resolve the documented prompt format for a model name, or null when unknown. */
export function resolveEmbeddingPromptFormat(
  model: string,
): EmbeddingPromptFormat | null {
  const name = model.toLowerCase();
  return (
    EMBEDDING_PROMPT_FORMATS.find(({ family }) => name.includes(family)) ?? null
  );
}

/**
 * Apply the model's documented task prefix for the given role. Unknown models
 * are returned unchanged — a safe no-op.
 */
export function applyEmbeddingRole(
  model: string,
  role: EmbeddingRole,
  text: string,
): string {
  const format = resolveEmbeddingPromptFormat(model);
  if (!format) return text;
  return `${role === 'query' ? format.queryPrefix : format.documentPrefix}${text}`;
}
