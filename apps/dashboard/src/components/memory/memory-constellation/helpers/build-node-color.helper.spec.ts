import { describe, expect, it } from 'vitest';

import { buildNodeColor } from './build-node-color.helper';

describe('buildNodeColor', () => {
  it('maps every member and the category dot to the topic color', () => {
    const colors = buildNodeColor([
      { key: 'x', label: 'x', color: '#f00', memberIds: ['a', 'b'] },
    ]);

    expect(colors.get('a')).toBe('#f00');
    expect(colors.get('b')).toBe('#f00');
    expect(colors.get('topic:x')).toBe('#f00');
  });

  it('maps cluster hubs to the cluster color', () => {
    const colors = buildNodeColor(
      [{ key: 'x', label: 'x', color: '#f00', memberIds: ['a'] }],
      [
        {
          key: 'games',
          label: 'games',
          color: '#f97316',
          memberTopicKeys: ['x'],
          memberIds: ['a'],
        },
      ],
    );

    expect(colors.get('cluster:games')).toBe('#f97316');
  });
});
