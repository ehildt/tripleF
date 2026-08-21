import { describe, expect, it } from 'vitest';

import { deterministicPointId } from './deterministic-point-id.helper.js';

describe('deterministicPointId', () => {
  it('returns the same UUID for the same seed (retry idempotency)', () => {
    const seed = 'sess-1|episodic|conv-1|user|0|I prefer single-line ifs.';
    expect(deterministicPointId(seed)).toBe(deterministicPointId(seed));
  });

  it('returns different ids for different seeds', () => {
    const base = 'sess-1|episodic|conv-1|user|0|text';
    expect(deterministicPointId(base)).not.toBe(
      deterministicPointId(`${base}-different`),
    );
    expect(deterministicPointId(base)).not.toBe(
      deterministicPointId(base.replace('sess-1', 'sess-2')),
    );
  });

  it('distinguishes partitions and tiers in the seed', () => {
    const seed = 'text about memory';
    const partitionA = `sess-a|episodic|conv-1|user|0|${seed}`;
    const partitionB = `sess-b|episodic|conv-1|user|0|${seed}`;
    const globalTier = `sess-a|global|conv-1|user|0|${seed}`;
    expect(deterministicPointId(partitionA)).not.toBe(
      deterministicPointId(partitionB),
    );
    expect(deterministicPointId(partitionA)).not.toBe(
      deterministicPointId(globalTier),
    );
  });

  it('produces a UUID-shaped id', () => {
    const id = deterministicPointId('anything');
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
