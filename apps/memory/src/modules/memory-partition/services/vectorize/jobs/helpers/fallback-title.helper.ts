import { CLUSTER_TITLE_LIMIT } from '../../../../../qdrant/constants/cluster.constant.js';
import type { ClusterPoint } from '../../../../helpers/detect-clusters.helper.js';

import { modalCategory } from './modal-category.helper.js';

/** Fallback title when the summary verdict is unparseable. */
export function fallbackTitle(members: ClusterPoint[]): string {
  const category = modalCategory(members);
  if (category) return category;
  const first = members.find((member) => member.text.trim())?.text.trim();
  return first ? first.slice(0, CLUSTER_TITLE_LIMIT) : 'untitled';
}
