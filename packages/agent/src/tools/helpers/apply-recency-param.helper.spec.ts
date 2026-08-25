import { describe, expect, it } from 'vitest';

import { applyRecencyParam } from './apply-recency-param.helper.js';

describe('applyRecencyParam', () => {
  it('sets the tbs token for a recency', () => {
    const body: Record<string, unknown> = {};
    applyRecencyParam(body, 'week');
    expect(body.tbs).toBe('qdr:w');
  });

  it('appends to an existing tbs value', () => {
    const body: Record<string, unknown> = { tbs: 'isz:lt,islt:xga' };
    applyRecencyParam(body, 'day');
    expect(body.tbs).toBe('isz:lt,islt:xga,qdr:d');
  });

  it('does nothing for an undefined recency', () => {
    const body: Record<string, unknown> = {};
    applyRecencyParam(body, undefined);
    expect(body).toEqual({});
  });
});
