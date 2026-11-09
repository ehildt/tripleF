import { describe, expect, it } from 'vitest';

import { parseMutedToastMessages } from './parse-muted-toast-messages.helper';

describe('parseMutedToastMessages', () => {
  it.each([null, ''])('returns empty history for missing value %s', (saved) => {
    expect(parseMutedToastMessages(saved)).toEqual([]);
  });

  it('retains valid entries in order without deduplication or truncation', () => {
    const entries = [
      { key: 'k-model', sample: 'First' },
      { key: '', sample: '' },
      { key: 'k-model', sample: 'Duplicate identity' },
    ];

    expect(parseMutedToastMessages(JSON.stringify(entries))).toEqual(entries);
  });

  it('filters malformed entries independently', () => {
    const result = parseMutedToastMessages(
      JSON.stringify([
        null,
        {},
        { key: 1, sample: 'invalid' },
        { key: 'valid', sample: 'Valid' },
        { key: 'missing-sample' },
      ]),
    );

    expect(result).toEqual([{ key: 'valid', sample: 'Valid' }]);
  });

  it('preserves existing extra fields on valid entries', () => {
    expect(
      parseMutedToastMessages(
        JSON.stringify([{ key: 'k', sample: 'Sample', retained: true }]),
      ),
    ).toEqual([{ key: 'k', sample: 'Sample', retained: true }]);
  });

  it.each(['{', 'null', '{}', 'true', '"muted"'])(
    'returns empty history for corrupt or non-array payload %s',
    (saved) => {
      expect(parseMutedToastMessages(saved)).toEqual([]);
    },
  );
});
