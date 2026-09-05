import { describe, expect, it } from 'vitest';

import { parseFrictionVerdict } from './parse-friction-verdict.helper.js';

describe('parseFrictionVerdict', () => {
  it('parses a valid verdict', () => {
    expect(
      parseFrictionVerdict(
        JSON.stringify({
          contradicts: true,
          conflictingId: 'p2',
          winnerId: 'p2',
          reason: 'later wins',
        }),
      ),
    ).toEqual({
      contradicts: true,
      conflictingId: 'p2',
      winnerId: 'p2',
      reason: 'later wins',
    });
  });

  it('tolerates markdown fences around the verdict JSON', () => {
    expect(parseFrictionVerdict('```json\n{"contradicts":false}\n```')).toEqual(
      { contradicts: false },
    );
  });

  it('returns undefined for empty or undefined text', () => {
    expect(parseFrictionVerdict('  ')).toBeUndefined();
    expect(parseFrictionVerdict(undefined)).toBeUndefined();
  });

  it('returns undefined for unparseable text', () => {
    expect(parseFrictionVerdict('not json at all')).toBeUndefined();
  });

  it('returns undefined on a schema violation', () => {
    expect(
      parseFrictionVerdict(JSON.stringify({ contradicts: 'yes' })),
    ).toBeUndefined();
  });

  it('returns undefined when a contradiction omits the conflicting id', () => {
    expect(
      parseFrictionVerdict(JSON.stringify({ contradicts: true })),
    ).toBeUndefined();
  });
});
