import { describe, expect, it } from 'vitest';

import { getEnabledToolNames } from './get-enabled-tool-names.helper.js';

const baseCfg = {
  serper: { enabled: false },
  brightData: { enabled: false },
  eodhd: { enabled: false },
  youtube: { enabled: false },
  playwright: { enabled: false },
} as never;

describe('getEnabledToolNames', () => {
  it('includes memory tools only when the memory feature is enabled', () => {
    expect(getEnabledToolNames(baseCfg, false)).not.toContain(
      'memory-partition-remember',
    );
    expect(getEnabledToolNames(baseCfg, true)).toEqual(
      expect.arrayContaining([
        'memory-partition-remember',
        'memory-partition-recall',
        'memory-partition-delete',
        'memory-cognition-remember',
        'memory-cognition-forget',
      ]),
    );
  });

  it('defaults to no memory tools when the flag is omitted', () => {
    expect(getEnabledToolNames(baseCfg)).not.toContain(
      'memory-partition-recall',
    );
  });
});
