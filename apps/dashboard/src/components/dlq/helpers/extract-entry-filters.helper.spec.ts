import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { extractEntryFilters } from './extract-entry-filters.helper';

const makeEntry = (payload: DlqEntry['payload']): DlqEntry =>
  ({ payload }) as DlqEntry;

describe('extractEntryFilters', () => {
  it('returns empty strings and the harness default for a missing entry', () => {
    expect(extractEntryFilters(undefined)).toEqual({
      roomId: '',
      event: 'harness',
      model: '',
    });
  });

  it('returns empty strings and the harness default when there is no payload', () => {
    expect(extractEntryFilters(makeEntry(null))).toEqual({
      roomId: '',
      event: 'harness',
      model: '',
    });
  });

  it('reads roomId, event and model from the payload filters', () => {
    const entry = makeEntry({
      filters: { roomId: 'room1', event: 'chat', model: 'llama3' },
    });
    expect(extractEntryFilters(entry)).toEqual({
      roomId: 'room1',
      event: 'chat',
      model: 'llama3',
    });
  });

  it('defaults the event to harness when the filter is absent', () => {
    const entry = makeEntry({ filters: { roomId: 'room1' } });
    expect(extractEntryFilters(entry).event).toBe('harness');
  });

  it('coerces non-string filter values to strings', () => {
    const entry = makeEntry({ filters: { roomId: 42, model: 0 } });
    expect(extractEntryFilters(entry).roomId).toBe('42');
    expect(extractEntryFilters(entry).model).toBe('0');
  });

  it('ignores a filters value that is not an object', () => {
    const entry = makeEntry({ filters: 'room1' });
    expect(extractEntryFilters(entry)).toEqual({
      roomId: '',
      event: 'harness',
      model: '',
    });
  });
});
