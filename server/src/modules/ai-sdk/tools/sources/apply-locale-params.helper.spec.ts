import { describe, expect, it } from 'vitest';

import { applyLocaleParams } from './apply-locale-params.helper.js';

describe('applyLocaleParams', () => {
  it('sets hl and resolves a likely country', () => {
    const body: Record<string, unknown> = {};
    applyLocaleParams(body, 'de');
    expect(body.hl).toBe('de');
    expect(body.gl).toBe('de');
  });

  it('does nothing for an undefined lang', () => {
    const body: Record<string, unknown> = {};
    applyLocaleParams(body, undefined);
    expect(body).toEqual({});
  });

  it('sends only hl when no region resolves', () => {
    const body: Record<string, unknown> = {};
    applyLocaleParams(body, 'xx');
    expect(body.hl).toBe('xx');
    expect(body.gl).toBeUndefined();
  });
});
