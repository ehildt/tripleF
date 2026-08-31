/** Normalize a stored fact into the record shape. */
export function mapFact(
  item: {
    id?: string;
    text?: unknown;
    createdAt?: string;
    tags?: string[];
    role?: string;
    category?: string;
    clusterId?: string;
    subject?: string;
    kind?: string;
    stability?: string;
    isConsolidated?: boolean;
    isLinked?: boolean;
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
    evidenceIds?: string[];
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
    clusterId: item.clusterId,
    subject: item.subject,
    kind: item.kind,
    stability: item.stability,
    isConsolidated: item.isConsolidated,
    isLinked: item.isLinked,
    isReflected: item.isReflected,
    isFriction: item.isFriction,
    superseded: item.superseded,
    supersededBy: item.supersededBy,
    evidenceIds: item.evidenceIds,
  };
}
