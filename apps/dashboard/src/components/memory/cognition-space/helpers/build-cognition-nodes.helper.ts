import { truncateText } from '../../memory-constellation/helpers/truncate-text.helper';
import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

/** Cluster key for insights that carry no routing path. */
const INSIGHTS_CLUSTER = 'insights';
/** Cluster key grouping all synthesized convictions (the AI's own conclusions). */
const CONVICTIONS_CLUSTER = 'convictions';
/** Tooltip capture length for a profile field's value. */
const SUMMARY_CHARS = 140;

/** Parse the stored profile into a plain object, or null when malformed. */
function parseProfile(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** A field is a leaf only when it holds something worth showing. */
function isNonEmptyValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/** Readable single-line summary of a field value (never raw JSON). */
function summarizeValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const items = value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    );
    const plural = items.length === 1 ? '' : 's';
    return `${items.length} item${plural}: ${items.join(', ')}`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).filter((key) =>
      isNonEmptyValue((value as Record<string, unknown>)[key]),
    );
    const plural = keys.length === 1 ? '' : 's';
    return `${keys.length} field${plural}: ${keys.join(', ')}`;
  }
  return String(value);
}

/**
 * Build the constellation nodes for one profile field: the field node itself
 * (the topic hub, with a readable summary) plus one leaf dot per nested
 * value — array items and object sub-keys, recursing for nested objects.
 * Scalars produce just the field node.
 */
function buildFieldNodes(
  fieldName: string,
  value: unknown,
  path: string,
): ConstellationNode[] {
  const summary = summarizeValue(value);
  const nodes: ConstellationNode[] = [
    {
      id: `cognition-profile:${path}`,
      label: path.split('.').pop() ?? fieldName,
      topicKey: fieldName,
      text: summary,
      summary: truncateText(summary, SUMMARY_CHARS),
      keys: [fieldName],
      meta: [{ label: 'field', value: path }],
    },
  ];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item !== 'string' || !item.trim()) return;
      nodes.push({
        id: `cognition-profile:${path}:${index}`,
        label: item,
        topicKey: fieldName,
        text: item,
        summary: truncateText(item, SUMMARY_CHARS),
        keys: [fieldName],
        meta: [{ label: 'field', value: path }],
      });
    });
  } else if (value && typeof value === 'object') {
    for (const [subKey, subValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (!isNonEmptyValue(subValue)) continue;
      nodes.push(...buildFieldNodes(fieldName, subValue, `${path}.${subKey}`));
    }
  }

  return nodes;
}

/**
 * Map the cognition snapshot to constellation dots: each top-level profile
 * field is its own topic blob (the field node plus its nested leafs), each
 * derived insight topics by its top-level routing path segment
 * (`likes.cars` → `likes`), and every conviction (the AI's synthesized
 * conclusions about the user/self model) groups under the convictions topic.
 * The profile document itself is not rendered —
 * it is the source/existence of the diagram, represented by the ZERO root.
 */
export function buildCognitionNodes(
  profile: string | null,
  insights: ReadonlyArray<{
    id: string;
    text: string;
    path?: string;
    isConsolidated?: boolean;
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
  }>,
  convictions: ReadonlyArray<{
    id: string;
    text: string;
    evidenceIds?: string[];
    isReflected?: boolean;
    isFriction?: boolean;
    superseded?: boolean;
    supersededBy?: string;
  }> = [],
): ConstellationNode[] {
  const nodes: ConstellationNode[] = [];

  if (profile?.trim()) {
    const parsed = parseProfile(profile);
    const fields = parsed
      ? Object.entries(parsed).filter(([, value]) => isNonEmptyValue(value))
      : [];

    for (const [fieldName, value] of fields) {
      nodes.push(...buildFieldNodes(fieldName, value, fieldName));
    }
  }

  insights.forEach((insight) => {
    const path = insight.path?.trim();
    const topicKey = path ? path.split('.')[0] : INSIGHTS_CLUSTER;
    nodes.push({
      id: insight.id,
      label: topicKey,
      topicKey,
      text: insight.text,
      summary: insight.text,
      keys: path ? [path, topicKey] : [INSIGHTS_CLUSTER],
      meta: path ? [{ label: 'path', value: path }] : [],
      isConsolidated: insight.isConsolidated,
      isReflected: insight.isReflected,
      isFriction: insight.isFriction,
      superseded: insight.superseded,
    });
  });

  convictions.forEach((conviction) => {
    const evidenceCount = conviction.evidenceIds?.length ?? 0;
    nodes.push({
      id: conviction.id,
      label: CONVICTIONS_CLUSTER,
      topicKey: CONVICTIONS_CLUSTER,
      text: conviction.text,
      summary: conviction.text,
      keys: [CONVICTIONS_CLUSTER],
      meta:
        evidenceCount > 0
          ? [
              {
                label: 'evidence',
                value: `${evidenceCount} fact${evidenceCount === 1 ? '' : 's'}`,
              },
            ]
          : [],
      isConviction: true,
      isReflected: conviction.isReflected,
      isFriction: conviction.isFriction,
      superseded: conviction.superseded,
    });
  });

  return nodes;
}
