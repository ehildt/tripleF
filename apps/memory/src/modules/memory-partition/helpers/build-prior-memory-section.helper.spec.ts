import { describe, expect, it } from 'vitest';

import type { MemoryPoint } from '../../qdrant/models/memory.model.js';

import { buildPriorMemorySection } from './build-prior-memory-section.helper.js';

const point = (overrides: Partial<MemoryPoint> = {}): MemoryPoint =>
  ({
    text: 'Likes dogs',
    role: 'user',
    createdAt: '2025-01-02T10:00:00.000Z',
    ...overrides,
  }) as MemoryPoint;

describe('buildPriorMemorySection', () => {
  it('returns undefined for an empty probe result', () => {
    expect(buildPriorMemorySection([])).toBeUndefined();
  });

  it('renders one provenance line per stored fact', () => {
    const section = buildPriorMemorySection([
      point(),
      point({ text: 'Prefers vim', role: 'assistant' }),
    ]);

    expect(section).toContain('ALREADY STORED IN MEMORY');
    expect(section).toContain(
      '"Likes dogs" — stated by the user on 2025-01-02',
    );
    expect(section).toContain(
      '"Prefers vim" — stated by you (assistant) on 2025-01-02',
    );
  });

  it('omits the date when the record carries none', () => {
    const section = buildPriorMemorySection([point({ createdAt: undefined })]);

    expect(section).toContain('"Likes dogs" — stated by the user');
    expect(section).not.toContain(' on ');
  });

  it('lists facts in the order the probe returned them', () => {
    const section = buildPriorMemorySection([
      point({ text: 'first' }),
      point({ text: 'second' }),
    ])!;

    expect(section.indexOf('"first"')).toBeLessThan(
      section.indexOf('"second"'),
    );
  });
});
