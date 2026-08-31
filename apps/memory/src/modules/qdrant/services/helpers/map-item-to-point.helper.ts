import { INSIGHT_TAGS } from '@triplef/agent/schemas';

import { deterministicPointId } from '../../helpers/deterministic-point-id.helper.js';

/** Assemble one cognition insight point from a store item. */
export function mapItemToPoint(
  item: { text: string; path?: string },
  index: number,
  vectors: number[][],
  memoryCognition: string,
) {
  return {
    id: deterministicPointId(
      `${memoryCognition}|cognition|insight|${item.text}`,
    ),
    vector: vectors[index],
    text: item.text,
    tags: [...INSIGHT_TAGS],
    path: item.path,
  };
}
