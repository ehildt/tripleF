import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation';

import { buildExchangeSections } from './build-exchange-sections.helper';

function user(id: string, content = 'prompt'): Exchange {
  return { id, role: 'user', content, status: 'done' };
}

function assistant(id: string, content = 'reply'): Exchange {
  return { id, role: 'assistant', content, status: 'done' };
}

describe('buildExchangeSections', () => {
  it('returns an empty list for no exchanges', () => {
    expect(buildExchangeSections([])).toEqual([]);
  });

  it('pairs each user prompt with its following assistant response', () => {
    const sections = buildExchangeSections([
      user('u1'),
      assistant('a1'),
      user('u2'),
      assistant('a2'),
    ]);

    expect(sections).toHaveLength(2);
    expect(sections[0]).toEqual({
      id: 'u1',
      user: user('u1'),
      assistants: [assistant('a1')],
    });
    expect(sections[1]).toEqual({
      id: 'u2',
      user: user('u2'),
      assistants: [assistant('a2')],
    });
  });

  it('keeps a user prompt with no assistant yet as its own section', () => {
    const sections = buildExchangeSections([user('u1')]);

    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual({
      id: 'u1',
      user: user('u1'),
      assistants: [],
    });
  });

  it('appends multiple assistant responses to the same section', () => {
    const sections = buildExchangeSections([
      user('u1'),
      assistant('a1'),
      assistant('a2'),
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].assistants).toEqual([assistant('a1'), assistant('a2')]);
  });

  it('wraps an orphan assistant with no preceding user in its own section', () => {
    const sections = buildExchangeSections([assistant('a1')]);

    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual({
      id: 'a1',
      user: undefined,
      assistants: [assistant('a1')],
    });
  });

  it('does not mutate the input exchanges', () => {
    const exchanges = [user('u1'), assistant('a1')];
    const snapshot = JSON.stringify(exchanges);
    buildExchangeSections(exchanges);
    expect(JSON.stringify(exchanges)).toBe(snapshot);
  });
});
