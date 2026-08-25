import { describe, expect, it } from 'vitest';

import type { ConstellationLink } from '../MemoryConstellation.types';
import { collectInterScores } from './collect-inter-scores.helper';

const clusterByNode = new Map([
  ['a', 'x'],
  ['b', 'x'],
  ['c', 'y'],
  ['e', 'z'],
]);

const makeLink = (
  source: string,
  target: string,
  score: number,
  suggested?: boolean,
): ConstellationLink => ({
  source,
  target,
  type: 'semantic',
  score,
  suggested,
});

describe('collectInterScores', () => {
  it('keeps the max score per cluster pair', () => {
    const scores = collectInterScores(
      [makeLink('b', 'c', 0.6), makeLink('a', 'c', 0.9)],
      clusterByNode,
      new Map(),
      0.5,
    );

    expect(scores.get('x\u0000y')?.score).toBeCloseTo(0.9);
    expect(scores.get('x\u0000y')?.suggested).toBe(false);
    expect(scores.size).toBe(1);
  });

  it('marks a pair suggested when any contributing link is topical', () => {
    const scores = collectInterScores(
      [makeLink('b', 'c', 0.6), makeLink('a', 'c', 0.9, true)],
      clusterByNode,
      new Map(),
      0.5,
    );

    expect(scores.get('x\u0000y')?.score).toBeCloseTo(0.9);
    expect(scores.get('x\u0000y')?.suggested).toBe(true);
  });

  it('drops links below the minimum score', () => {
    const scores = collectInterScores(
      [makeLink('b', 'c', 0.55)],
      clusterByNode,
      new Map(),
      0.7,
    );

    expect(scores.size).toBe(0);
  });

  it('drops links with unknown nodes or inside one cluster', () => {
    const scores = collectInterScores(
      [makeLink('a', 'ghost', 0.9), makeLink('a', 'b', 0.9)],
      clusterByNode,
      new Map(),
      0.5,
    );

    expect(scores.size).toBe(0);
  });

  it('keeps same-community pairs flagged as siblings', () => {
    const communityByCluster = new Map([
      ['x', 'games'],
      ['y', 'games'],
    ]);
    const scores = collectInterScores(
      [makeLink('b', 'c', 0.9), makeLink('b', 'e', 0.9)],
      clusterByNode,
      communityByCluster,
      0.5,
    );

    // x↔y shares the games community (sibling); x↔z crosses communities.
    expect(scores.size).toBe(2);
    expect(scores.get('x\u0000y')?.sameCommunity).toBe(true);
    expect(scores.get('x\u0000z')?.sameCommunity).toBe(false);
  });
});
