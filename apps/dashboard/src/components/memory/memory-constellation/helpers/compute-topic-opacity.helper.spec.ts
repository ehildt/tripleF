import { describe, expect, it } from 'vitest';

import { computeTopicOpacity } from './compute-topic-opacity.helper';

describe('computeTopicOpacity', () => {
  it('keeps every topic fully opaque below the zoom threshold', () => {
    const opacity = computeTopicOpacity(
      [
        { topicKey: 'a', x: 0, y: 0 },
        { topicKey: 'b', x: 100, y: 0 },
      ],
      50,
      0,
      1,
    );

    expect(opacity.get('a')).toBe(1);
    expect(opacity.get('b')).toBe(1);
  });

  it('fades non-focus topics to 0.25 when fully zoomed in', () => {
    const opacity = computeTopicOpacity(
      [
        { topicKey: 'a', x: 0, y: 0 },
        { topicKey: 'b', x: 100, y: 0 },
      ],
      0,
      0,
      3,
    );

    expect(opacity.get('a')).toBe(1);
    expect(opacity.get('b')).toBe(0.25);
  });

  it('interpolates the fade between the threshold and the max zoom', () => {
    const opacity = computeTopicOpacity(
      [
        { topicKey: 'a', x: 0, y: 0 },
        { topicKey: 'b', x: 100, y: 0 },
      ],
      0,
      0,
      2.25,
    );

    // fade = (2.25 - 1.5) / (3 - 1.5) = 0.5 → 1 - 0.5 * 0.75 = 0.625
    expect(opacity.get('b')).toBeCloseTo(0.625);
  });

  it('returns an empty map for no points', () => {
    expect(computeTopicOpacity([], 0, 0, 3).size).toBe(0);
  });
});
