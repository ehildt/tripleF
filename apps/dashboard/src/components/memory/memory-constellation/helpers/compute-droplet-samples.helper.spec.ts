import { describe, expect, it } from 'vitest';

import type { PreparedLink } from '../MemoryConstellation.types';
import { computeDropletSamples } from './compute-droplet-samples.helper';
import { dropletCount } from './droplet-count.helper';

function link(score?: number): PreparedLink {
  return { a: 0, b: 1, kind: 'inter', score, alpha: 1 };
}

describe('computeDropletSamples', () => {
  it('yields one droplet per slot with alternating directions', () => {
    const samples = computeDropletSamples(
      link(0.9),
      1.5,
      3,
      1,
      '#ff0000',
      '#0000ff',
    );

    expect(samples).toHaveLength(dropletCount(0.9));
    expect(samples.every((sample, j) => sample.forward === (j % 2 === 0))).toBe(
      true,
    );
  });

  it('colors each direction by the endpoint it departs from', () => {
    const samples = computeDropletSamples(
      link(0.9),
      2.25,
      1,
      1,
      '#ff0000',
      '#0000ff',
    );

    for (const sample of samples) {
      expect(sample.color).toBe(sample.forward ? '#ff0000' : '#0000ff');
    }
  });

  it('keeps positions inside [0, 1] and alpha bounded', () => {
    for (let index = 0; index < 5; index++) {
      for (let time = 0; time < 10; time += 0.5) {
        for (const sample of computeDropletSamples(
          link(0.6),
          time,
          index,
          0.8,
          '#fff',
          '#fff',
        )) {
          expect(sample.u).toBeGreaterThanOrEqual(0);
          expect(sample.u).toBeLessThanOrEqual(1);
          expect(sample.alpha).toBeGreaterThanOrEqual(0);
          expect(sample.alpha).toBeLessThanOrEqual(1.6);
        }
      }
    }
  });

  it('is deterministic for the same link, time and index', () => {
    const first = computeDropletSamples(
      link(0.5),
      3.3,
      2,
      1,
      '#ff0000',
      '#0000ff',
    );
    const second = computeDropletSamples(
      link(0.5),
      3.3,
      2,
      1,
      '#ff0000',
      '#0000ff',
    );

    expect(second).toEqual(first);
  });

  it('moves droplets over time in their respective directions', () => {
    const before = computeDropletSamples(link(1), 0.1, 0, 1, '#fff', '#fff');
    const after = computeDropletSamples(link(1), 1.1, 0, 1, '#fff', '#fff');

    const movedForward = before.some(
      (sample, j) => sample.forward && after[j].u !== sample.u,
    );
    const movedReverse = before.some(
      (sample, j) => !sample.forward && after[j].u !== sample.u,
    );
    expect(movedForward).toBe(true);
    expect(movedReverse).toBe(true);
  });
});
