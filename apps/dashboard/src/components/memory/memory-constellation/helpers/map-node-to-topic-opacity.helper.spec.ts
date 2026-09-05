import { describe, expect, it } from 'vitest';

import { mapNodeToTopicOpacity } from './map-node-to-topic-opacity.helper';

describe('mapNodeToTopicOpacity', () => {
  it('builds a topic-opacity input from a node and its projected point', () => {
    expect(
      mapNodeToTopicOpacity({ id: 'n1', topicKey: 'c1' } as never, 1, [
        { x: 0, y: 0, scale: 1 },
        { x: 5, y: 6, scale: 0.5 },
      ]),
    ).toEqual({ topicKey: 'c1', x: 5, y: 6 });
  });
});
