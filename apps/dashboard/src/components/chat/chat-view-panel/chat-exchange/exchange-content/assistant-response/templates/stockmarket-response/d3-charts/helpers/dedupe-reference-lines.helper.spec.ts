import { describe, expect, it } from 'vitest';

import { dedupeReferenceLines } from './dedupe-reference-lines.helper';

describe('dedupeReferenceLines', () => {
  it('keeps distinct levels', () => {
    const lines = [
      { value: 100, label: 'Support' },
      { value: 150, label: 'Resistance' },
    ];
    expect(dedupeReferenceLines(lines)).toHaveLength(2);
  });

  it('drops levels within the relative epsilon of a kept line', () => {
    const lines = [
      { value: 224.94, label: 'Current' },
      { value: 224.09, label: 'Previous close' },
    ];
    const kept = dedupeReferenceLines(lines);
    expect(kept).toHaveLength(1);
    expect(kept[0].label).toBe('Current');
  });

  it('keeps the first of a near-duplicate pair', () => {
    const kept = dedupeReferenceLines([
      { value: 100, label: 'A' },
      { value: 100.1, label: 'B' },
    ]);
    expect(kept).toHaveLength(1);
    expect(kept[0].label).toBe('A');
  });

  it('does not collapse genuinely distinct close levels', () => {
    const kept = dedupeReferenceLines([
      { value: 100, label: 'A' },
      { value: 120, label: 'B' },
    ]);
    expect(kept).toHaveLength(2);
  });
});
