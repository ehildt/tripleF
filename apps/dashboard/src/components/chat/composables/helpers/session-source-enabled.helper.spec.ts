import { describe, expect, it } from 'vitest';

import { sessionSourceEnabled } from './session-source-enabled.helper';

describe('sessionSourceEnabled', () => {
  it('returns the session toggle state', () => {
    const session = { serper: { webSearch: { enabled: true } } };

    expect(sessionSourceEnabled(session, 'serper', 'webSearch')).toBe(true);
  });

  it('returns undefined when the session has no toggle', () => {
    expect(
      sessionSourceEnabled({ serper: {} }, 'serper', 'webSearch'),
    ).toBeUndefined();
    expect(sessionSourceEnabled(null, 'serper', 'webSearch')).toBeUndefined();
  });

  it('returns undefined for a non-boolean value', () => {
    const session = { serper: { webSearch: { enabled: 'yes' } } };

    expect(
      sessionSourceEnabled(session, 'serper', 'webSearch'),
    ).toBeUndefined();
  });
});
