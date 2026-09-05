import { describe, expect, it } from 'vitest';

import { buildLinkIndices } from './build-link-indices.helper';

describe('buildLinkIndices', () => {
  it('resolves edge endpoints to visible-node indices', () => {
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 3],
    ]);
    const links = buildLinkIndices(
      [{ source: 'a', target: 'b', kind: 'intra' }],
      nodeIndex,
    );

    expect(links).toEqual([{ a: 0, b: 3, kind: 'intra', alpha: 0.5 }]);
  });

  it('lerps inter edge alpha across the [minScore, 1] domain', () => {
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);
    const links = buildLinkIndices(
      [
        { source: 'a', target: 'b', kind: 'inter', score: 0.7 },
        { source: 'a', target: 'b', kind: 'inter', score: 1.0 },
        { source: 'a', target: 'b', kind: 'inter', score: 0.85 },
      ],
      nodeIndex,
      0.7,
    );

    expect(links[0]?.alpha).toBeCloseTo(0.15); // at the bar → faintest
    expect(links[1]?.alpha).toBeCloseTo(0.85); // near-duplicate → strongest
    expect(links[2]?.alpha).toBeCloseTo(0.15 + 0.7 * 0.5); // midway
  });

  it('clamps scores outside the domain', () => {
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);
    const links = buildLinkIndices(
      [{ source: 'a', target: 'b', kind: 'inter', score: 1.5 }],
      nodeIndex,
      0.7,
    );

    expect(links[0]?.alpha).toBeCloseTo(0.85);
  });

  it('gives cluster edges the fixed structural alpha', () => {
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);
    const links = buildLinkIndices(
      [{ source: 'a', target: 'b', kind: 'cluster' }],
      nodeIndex,
    );

    expect(links[0]?.alpha).toBeCloseTo(0.5);
  });

  it('renders suggested inter edges at a fraction of the score alpha', () => {
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);
    const links = buildLinkIndices(
      [
        { source: 'a', target: 'b', kind: 'inter', score: 0.8 },
        {
          source: 'a',
          target: 'b',
          kind: 'inter',
          score: 0.8,
          suggested: true,
        },
      ],
      nodeIndex,
      0.7,
    );

    const scoreAlpha = 0.15 + 0.7 / 3; // norm = (0.8 - 0.7) / 0.3 = 1/3
    expect(links[0]?.alpha).toBeCloseTo(scoreAlpha);
    expect(links[0]?.weak).toBe(true);
    expect(links[1]?.alpha).toBeCloseTo(scoreAlpha * 0.6);
    expect(links[1]?.suggested).toBe(true);
    expect(links[1]?.weak).toBe(true);
  });

  it('flags inter edges below the strong-relation tier as weak', () => {
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);
    const links = buildLinkIndices(
      [
        // norm = (score - 0.7) / 0.3 → 0.717… → 0.056 → weak
        { source: 'a', target: 'b', kind: 'inter', score: 0.717 },
        // norm 0.6 → weak
        { source: 'a', target: 'b', kind: 'inter', score: 0.88 },
        // norm 0.97 → a genuinely strong relation, stays a dashed flow line
        { source: 'a', target: 'b', kind: 'inter', score: 0.99 },
      ],
      nodeIndex,
      0.7,
    );

    expect(links[0]?.weak).toBe(true);
    expect(links[1]?.weak).toBe(true);
    expect(links[2]?.weak).toBeUndefined();
  });

  it('never flags sibling edges as weak (related families are not weak links)', () => {
    const nodeIndex = new Map([
      ['a', 0],
      ['b', 1],
    ]);
    const links = buildLinkIndices(
      [{ source: 'a', target: 'b', kind: 'sibling', score: 0.72 }],
      nodeIndex,
      0.7,
    );

    expect(links[0]?.weak).toBeUndefined();
  });

  it('drops edges whose endpoints are not visible', () => {
    expect(
      buildLinkIndices(
        [{ source: 'a', target: 'ghost', kind: 'intra' }],
        new Map([['a', 0]]),
      ),
    ).toEqual([]);
  });
});
