import { describe, expect, it } from 'vitest';

import type { ConstellationLink } from '../MemoryConstellation.types';
import { collectInterScores } from './collect-inter-scores.helper';

const topicByNode = new Map([
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
  it('keeps the max score per topic pair', () => {
    const scores = collectInterScores(
      [makeLink('b', 'c', 0.6), makeLink('a', 'c', 0.9)],
      topicByNode,
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
      topicByNode,
      new Map(),
      0.5,
    );

    expect(scores.get('x\u0000y')?.score).toBeCloseTo(0.9);
    expect(scores.get('x\u0000y')?.suggested).toBe(true);
  });

  it('drops links below the minimum score', () => {
    const scores = collectInterScores(
      [makeLink('b', 'c', 0.55)],
      topicByNode,
      new Map(),
      0.7,
    );

    expect(scores.size).toBe(0);
  });

  it('drops links with unknown nodes or inside one topic', () => {
    const scores = collectInterScores(
      [makeLink('a', 'ghost', 0.9), makeLink('a', 'b', 0.9)],
      topicByNode,
      new Map(),
      0.5,
    );

    expect(scores.size).toBe(0);
  });

  it('keeps same-cluster pairs flagged as siblings', () => {
    const clusterByTopic = new Map([
      ['x', 'games'],
      ['y', 'games'],
    ]);
    const scores = collectInterScores(
      [makeLink('b', 'c', 0.9), makeLink('b', 'e', 0.9)],
      topicByNode,
      clusterByTopic,
      0.5,
    );

    // x↔y shares the games cluster (sibling); x↔z crosses clusters.
    expect(scores.size).toBe(2);
    expect(scores.get('x\u0000y')?.sameCluster).toBe(true);
    expect(scores.get('x\u0000z')?.sameCluster).toBe(false);
  });
});
