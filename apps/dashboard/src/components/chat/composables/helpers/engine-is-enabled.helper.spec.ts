import { describe, expect, it } from 'vitest';

import { engineIsEnabled } from './engine-is-enabled.helper';

describe('engineIsEnabled', () => {
  it('is false when neither snapshot nor override is set', () => {
    expect(engineIsEnabled({}, {}, 'serper')).toBe(false);
  });

  it('reads the snapshot enabled flag', () => {
    expect(engineIsEnabled({ serper: { enabled: true } }, {}, 'serper')).toBe(
      true,
    );
  });

  it('lets the session override win over the snapshot', () => {
    expect(
      engineIsEnabled(
        { serper: { enabled: true } },
        { serper: { enabled: false } },
        'serper',
      ),
    ).toBe(false);
  });

  it('ignores a non-boolean session override', () => {
    expect(
      engineIsEnabled(
        { serper: { enabled: true } },
        { serper: { enabled: 'yes' } },
        'serper',
      ),
    ).toBe(true);
  });
});
