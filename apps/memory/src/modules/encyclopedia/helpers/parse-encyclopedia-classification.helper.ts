import {
  type EncyclopediaClassification,
  EncyclopediaClassifySchema,
} from '@triplef/agent/schemas';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { normalizeCategory } from '../../memory-partition/helpers/normalize-category.helper.js';
import { normalizeCommunity } from '../../qdrant/helpers/normalize-community.helper.js';
import { normalizeNode } from '../../qdrant/helpers/normalize-node.helper.js';

import { normalizeTopic } from './normalize-topic.helper.js';

/**
 * Template glue for the encyclopedia classification step (mirrors the vectorize
 * parse-extraction helper): tolerant LLM-JSON parse (markdown fences, single
 * quotes, unquoted keys, JSON5 fallback) → zod template validation →
 * normalization (category/community/node to their canonical label forms;
 * topic lowercased and whitespace-folded). Throws a descriptive error so the
 * classify job can leave the document pending and retry on the next run.
 */
export function parseEncyclopediaClassification(
  text: string,
): EncyclopediaClassification {
  if (!text.trim()) {
    throw new Error('Classification returned empty output');
  }
  let parsed: unknown;
  try {
    parsed = parseLlmJson(text);
  } catch (parseError) {
    throw new Error(
      `Classification JSON parse failed: ${
        parseError instanceof Error ? parseError.message : String(parseError)
      }`,
      { cause: parseError },
    );
  }
  const validated = EncyclopediaClassifySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Classification failed the schema: ${validated.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  const category = normalizeCategory(validated.data.category);
  const topic = normalizeTopic(validated.data.topic);
  if (!category || !topic) {
    throw new Error('Classification normalized to an empty category or topic');
  }
  const community = normalizeCommunity(validated.data.community);
  const node = normalizeNode(validated.data.node);
  // The strict chain: a label that fails normalization breaks the chain —
  // throw so the job leaves the document pending and retries next run.
  if (!category || !community || !topic || !node) {
    throw new Error(
      'Classification failed normalization — the taxonomy chain lost a label',
    );
  }
  return {
    category,
    topic,
    community,
    node,
    icon: validated.data.icon,
  };
}
