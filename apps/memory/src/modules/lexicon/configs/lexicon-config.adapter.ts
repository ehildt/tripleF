import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';

import type { LexiconConfig } from '../models/lexicon-config.model.js';

export function LexiconConfigAdapter(env = process.env): LexiconConfig {
  return {
    selectEnabled: getBooleanEnv(env.LEXICON_SELECT_ENABLED, true)!,
    budgetChars: getNumberEnv(env.LEXICON_BUDGET_CHARS, 48_000) as number,
    chunkChars: getNumberEnv(env.LEXICON_CHUNK_CHARS, 1600) as number,
    chunkOverlapSentences: getNumberEnv(
      env.LEXICON_CHUNK_OVERLAP_SENTENCES,
      1,
    ) as number,
    scoreThreshold: getNumberEnv(env.LEXICON_SCORE_THRESHOLD, 0.25) as number,
    maxChunks: getNumberEnv(env.LEXICON_MAX_CHUNKS, 400) as number,
    persistEnabled: getBooleanEnv(env.LEXICON_PERSIST_ENABLED, true)!,
    probeLimit: getNumberEnv(env.LEXICON_PROBE_LIMIT, 3) as number,
    neighborExpansion: getNumberEnv(
      env.LEXICON_NEIGHBOR_EXPANSION,
      1,
    ) as number,
    maxDocumentChars: getNumberEnv(
      env.LEXICON_MAX_DOCUMENT_CHARS,
      4_000_000,
    ) as number,
    consolidateThreshold: getNumberEnv(
      env.LEXICON_CONSOLIDATE_THRESHOLD,
      200,
    ) as number,
  };
}
