import { describe, expect, it } from 'vitest';

import { parseConvictionSynthesis } from './parse-conviction-synthesis.helper.js';

const evidence = [
  { id: 'a', text: 'I am learning Rust' },
  { id: 'b', text: 'I am rewriting the payments service' },
  { id: 'c', text: 'I miss Go compile times' },
];

describe('parseConvictionSynthesis', () => {
  it('maps ordinal citations to real evidence ids', () => {
    const result = parseConvictionSynthesis(
      JSON.stringify({
        convictions: [
          {
            text: 'The user is migrating to Rust',
            target: 'bridge',
            evidence: [0, 1],
          },
        ],
      }),
      evidence,
      5,
    );

    expect(result).toEqual([
      {
        text: 'The user is migrating to Rust',
        target: 'bridge',
        evidenceIds: ['a', 'b'],
      },
    ]);
  });

  it('drops out-of-range (hallucinated) citations', () => {
    const result = parseConvictionSynthesis(
      JSON.stringify({
        convictions: [
          { text: 'A conviction', target: 'bridge', evidence: [0, 99] },
        ],
      }),
      evidence,
      5,
    );

    expect(result).toEqual([
      { text: 'A conviction', target: 'bridge', evidenceIds: ['a'] },
    ]);
  });

  it('drops statements with no surviving evidence', () => {
    const result = parseConvictionSynthesis(
      JSON.stringify({
        convictions: [
          { text: 'Unsupported', target: 'conviction', evidence: [99] },
        ],
      }),
      evidence,
      5,
    );

    expect(result).toEqual([]);
  });

  it('dedupes statements by claim text', () => {
    const result = parseConvictionSynthesis(
      JSON.stringify({
        convictions: [
          { text: 'Same conviction', target: 'bridge', evidence: [0] },
          { text: '  same conviction  ', target: 'conviction', evidence: [1] },
        ],
      }),
      evidence,
      5,
    );

    expect(result).toEqual([
      { text: 'Same conviction', target: 'bridge', evidenceIds: ['a'] },
    ]);
  });

  it('caps the number of statements', () => {
    const result = parseConvictionSynthesis(
      JSON.stringify({
        convictions: [
          { text: 'One', target: 'bridge', evidence: [0] },
          { text: 'Two', target: 'conviction', evidence: [1] },
          { text: 'Three', target: 'bridge', evidence: [2] },
        ],
      }),
      evidence,
      2,
    );

    expect(result).toHaveLength(2);
  });

  it('returns undefined for empty or unparseable text', () => {
    expect(parseConvictionSynthesis('  ', evidence, 5)).toBeUndefined();
    expect(parseConvictionSynthesis(undefined, evidence, 5)).toBeUndefined();
    expect(parseConvictionSynthesis('not json', evidence, 5)).toBeUndefined();
  });

  it('returns undefined on a schema violation', () => {
    expect(
      parseConvictionSynthesis(
        JSON.stringify({ convictions: 'nope' }),
        evidence,
        5,
      ),
    ).toBeUndefined();
  });
});
