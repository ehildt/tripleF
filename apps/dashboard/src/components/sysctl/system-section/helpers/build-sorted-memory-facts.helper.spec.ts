import { describe, expect, it } from 'vitest';

import type { MemoryFactRecord } from '@/api/memory.api';

import { buildSortedMemoryFacts } from './build-sorted-memory-facts.helper';

const makeFact = (overrides: Partial<MemoryFactRecord>): MemoryFactRecord =>
  ({ text: '', ...overrides }) as MemoryFactRecord;

describe('buildSortedMemoryFacts', () => {
  it('sorts facts by createdAt descending', () => {
    const facts = [
      makeFact({ text: 'old', createdAt: '2024-01-01T00:00:00Z' }),
      makeFact({ text: 'new', createdAt: '2024-01-03T00:00:00Z' }),
      makeFact({ text: 'mid', createdAt: '2024-01-02T00:00:00Z' }),
    ];

    const result = buildSortedMemoryFacts(facts);

    expect(result.map((fact) => fact.text)).toEqual(['new', 'mid', 'old']);
  });

  it('places undated facts after dated ones', () => {
    const facts = [
      makeFact({ text: 'undated' }),
      makeFact({ text: 'dated', createdAt: '2024-01-01T00:00:00Z' }),
    ];

    const result = buildSortedMemoryFacts(facts);

    expect(result.map((fact) => fact.text)).toEqual(['dated', 'undated']);
  });

  it('leaves the input array order untouched', () => {
    const facts = [
      makeFact({ text: 'a', createdAt: '2024-01-01T00:00:00Z' }),
      makeFact({ text: 'b', createdAt: '2024-01-02T00:00:00Z' }),
    ];

    buildSortedMemoryFacts(facts);

    expect(facts.map((fact) => fact.text)).toEqual(['a', 'b']);
  });

  it('returns an empty array when there are no facts', () => {
    expect(buildSortedMemoryFacts([])).toEqual([]);
  });
});
