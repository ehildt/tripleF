import type { DeleteTextFilter } from './build-delete-filter-query.helper.types.js';

/**
 * Serializes one `DELETE /memory/text` filter into its query string: absent
 * fields are skipped, tags are CSV-joined, and the cognition lane flag is
 * emitted as `cognition=true`. Both delete lanes (partition and cognition)
 * share the endpoint, so all three delete methods share this serializer.
 */
export function buildDeleteFilterQuery(filter: DeleteTextFilter): string {
  const params = new URLSearchParams({
    memoryPartition: filter.memoryPartition,
  });
  if (filter.cognition) params.set('cognition', 'true');
  if (filter.sessionId) params.set('sessionId', filter.sessionId);
  if (filter.conversationId)
    params.set('conversationId', filter.conversationId);
  if (filter.requestId) params.set('requestId', filter.requestId);
  if (filter.text) params.set('text', filter.text);
  if (filter.contains) params.set('contains', filter.contains);
  if (filter.path) params.set('path', filter.path);
  if (filter.tags?.length) params.set('tags', filter.tags.join(','));
  return params.toString();
}
