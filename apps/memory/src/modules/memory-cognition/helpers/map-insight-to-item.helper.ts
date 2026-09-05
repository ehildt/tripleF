import {
  INSIGHT_TEXT_LIMIT,
  type MemoryProfileInsight,
  normalizeInsightPath,
} from '@triplef/agent/schemas';

/** Normalize one profile insight into the store-item shape. */
export function mapInsightToItem(insight: MemoryProfileInsight) {
  return {
    text: insight.text.trim().slice(0, INSIGHT_TEXT_LIMIT),
    path: normalizeInsightPath(insight.path),
  };
}
