import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { extractEntryFilters } from './extract-entry-filters.helper';

function makeEntry(payload: DlqEntry['payload']): DlqEntry {
  return { id: 'record-1', payload } as DlqEntry;
}

function validFilters(overrides: Record<string, unknown> = {}) {
  return {
    conversationId: 'conversation-1',
    event: 'harness',
    ...overrides,
  };
}

describe('extractEntryFilters', () => {
  it('rejects a missing payload or filters object explicitly', () => {
    expect(() => extractEntryFilters(makeEntry(null))).toThrow(
      'record-1 has no harness filters',
    );
    expect(() => extractEntryFilters(makeEntry({ filters: 'room1' }))).toThrow(
      'record-1 has no harness filters',
    );
  });

  it('reads routing identity and original conversation settings', () => {
    const entry = makeEntry({
      filters: validFilters({
        roomId: 'room1',
        model: 'llama3',
        numCtx: 4096,
        think: 'high',
        stream: false,
      }),
    });

    expect(extractEntryFilters(entry)).toEqual({
      conversationId: 'conversation-1',
      roomId: 'room1',
      event: 'harness',
      model: 'llama3',
      numCtx: '4096',
      think: 'high',
      stream: false,
    });
  });

  it('preserves the original event and coerces optional scalar values', () => {
    const entry = makeEntry({
      filters: validFilters({ event: 'chat', roomId: 42, model: 0 }),
    });

    expect(extractEntryFilters(entry)).toMatchObject({
      roomId: '42',
      event: 'chat',
      model: '0',
    });
  });

  it('requires a non-empty conversation id and event', () => {
    expect(() =>
      extractEntryFilters(
        makeEntry({ filters: validFilters({ conversationId: '' }) }),
      ),
    ).toThrow('missing filters.conversationId');
    expect(() =>
      extractEntryFilters(makeEntry({ filters: { conversationId: 'c1' } })),
    ).toThrow('missing filters.event');
  });

  it('parses explicit boolean strings for streaming', () => {
    expect(
      extractEntryFilters(
        makeEntry({ filters: validFilters({ stream: 'true' }) }),
      ).stream,
    ).toBe(true);
    expect(
      extractEntryFilters(
        makeEntry({ filters: validFilters({ stream: 'false' }) }),
      ).stream,
    ).toBe(false);
  });

  it('rejects invalid streaming values instead of guessing', () => {
    expect(() =>
      extractEntryFilters(
        makeEntry({ filters: validFilters({ stream: 'yes' }) }),
      ),
    ).toThrow('invalid filters.stream');
  });
});
