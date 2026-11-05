import { describe, expect, it } from 'vitest';

import { getEnabledToolNames } from './get-enabled-tool-names.helper.js';

const baseCfg = {
  serper: { enabled: false },
  brightData: { enabled: false },
  eodhd: { enabled: false },
  youtube: { enabled: false },
} as never;

describe('getEnabledToolNames', () => {
  it('includes memory tools only when the memory feature is enabled', () => {
    expect(getEnabledToolNames(baseCfg, false)).not.toContain(
      'memory-partition-recall',
    );
    expect(getEnabledToolNames(baseCfg, true)).toEqual(
      expect.arrayContaining([
        'memory-partition-recall',
        'memory-partition-delete',
        'memory-cognition-forget',
      ]),
    );
    // No write tools are ever offered: writes are the vectorize pipeline's
    // judged background decision, never a classifier pick.
    expect(getEnabledToolNames(baseCfg, true)).not.toEqual(
      expect.arrayContaining([
        'memory-partition-remember',
        'memory-cognition-remember',
      ]),
    );
  });

  it('defaults to no memory tools when the flag is omitted', () => {
    expect(getEnabledToolNames(baseCfg)).not.toContain(
      'memory-partition-recall',
    );
  });
});
