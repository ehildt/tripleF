/** Normalize a stored fact into the record shape. */
export function mapFact(
  item: {
    id?: string;
    text?: unknown;
    createdAt?: string;
    tags?: string[];
    role?: string;
    category?: string;
  },
  index: number,
) {
  return {
    id: item.id ?? `fact-${index}`,
    text: item.text as string,
    createdAt: item.createdAt,
    tags: Array.isArray(item.tags) ? item.tags : [],
    role: item.role,
    category: item.category,
  };
}
