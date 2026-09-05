import { describe, expect, it } from 'vitest';

import type {
  ConstellationFriction,
  ConstellationNode,
} from '../MemoryConstellation.types';
import { buildHubMeta } from './build-hub-meta.helper';

const leaf = (over: Partial<ConstellationNode>): ConstellationNode => ({
  id: 'x',
  label: 'x',
  topicKey: 't',
  text: 'x',
  keys: [],
  ...over,
});

describe('buildHubMeta', () => {
  it('rolls up record count, sources, and freshness', () => {
    const rollup = buildHubMeta([
      leaf({
        id: 'a',
        domain: 'youtube.com',
        url: 'https://youtu.be/1',
        timestamp: '2026-09-01T00:00:00Z',
      }),
      leaf({
        id: 'b',
        domain: 'youtube.com',
        url: 'https://youtu.be/2',
        timestamp: '2026-09-02T00:00:00Z',
      }),
      leaf({
        id: 'c',
        domain: 'reddit.com',
        url: 'https://reddit.com/c',
        timestamp: '2026-08-30T00:00:00Z',
      }),
    ]);

    expect(rollup.meta).toEqual([
      { label: 'records', value: '3' },
      { label: 'sources', value: '2 domains · 3 urls' },
      { label: 'top sources', value: 'youtube.com ×2, reddit.com ×1' },
      { label: 'updated', value: '2026-09-02' },
    ]);
    expect(rollup.summary).toBe('3 records · 2 sources');
  });

  it('omits health rows the lane never writes', () => {
    const rollup = buildHubMeta([leaf({ id: 'a' }), leaf({ id: 'b' })]);

    expect(rollup.meta).toEqual([{ label: 'records', value: '2' }]);
    expect(rollup.summary).toBe('2 records');
  });

  it('shows reflected/consolidated ratios only for lanes that write them', () => {
    const rollup = buildHubMeta([
      leaf({ id: 'a', isReflected: true, isConsolidated: true }),
      leaf({ id: 'b', isReflected: false, isConsolidated: true }),
    ]);

    expect(rollup.meta).toContainEqual({ label: 'reflected', value: '1/2' });
    expect(rollup.meta).toContainEqual({ label: 'consolidated', value: '2/2' });
  });

  it('surfaces frictions and stale members only when non-zero', () => {
    const frictions: ConstellationFriction[] = [
      { source: 'a', target: 'b' },
      { source: 'z', target: 'zz' },
    ];
    const rollup = buildHubMeta(
      [leaf({ id: 'a' }), leaf({ id: 'b', superseded: true })],
      frictions,
    );

    expect(rollup.meta).toContainEqual({ label: 'stale', value: '1' });
    expect(rollup.meta).toContainEqual({ label: 'frictions', value: '1' });
    expect(rollup.summary).toBe('2 records · 1 frictions · 1 stale');

    // A hub whose members no friction touches reports no health rows.
    const clean = buildHubMeta([leaf({ id: 'q' })], frictions);
    expect(clean.meta.some((row) => row.label === 'frictions')).toBe(false);
    expect(clean.meta.some((row) => row.label === 'stale')).toBe(false);
  });

  it('uses the singular record word for a lone leaf', () => {
    expect(buildHubMeta([leaf({ id: 'a' })]).summary).toBe('1 record');
  });
});
