const MAX_QUERY_LENGTH = 48;

/** Truncate a long query to a readable length with an ellipsis. */
export function truncateQuery(query: string): string {
  return query.length > MAX_QUERY_LENGTH
    ? `${query.slice(0, MAX_QUERY_LENGTH).trimEnd()}…`
    : query;
}
