import { describe, expect, it } from 'vitest';

import { DEFAULT_TOAST_TYPE_FILTERS } from '../toast-settings.constant';
import { parseToastTypeFilters } from './parse-toast-type-filters.helper';

describe('parseToastTypeFilters', () => {
  it('returns fresh defaults for a missing value', () => {
    const result = parseToastTypeFilters(null);

    expect(result).toEqual(DEFAULT_TOAST_TYPE_FILTERS);
    expect(result).not.toBe(DEFAULT_TOAST_TYPE_FILTERS);
  });

  it('applies known boolean fields over their individual defaults', () => {
    const result = parseToastTypeFilters(
      JSON.stringify({ info: true, warning: false, error: false }),
    );

    expect(result).toEqual({
      info: true,
      success: false,
      warning: false,
      error: false,
      debug: false,
      default: false,
    });
  });

  it('ignores non-boolean and unknown fields independently', () => {
    const result = parseToastTypeFilters(
      JSON.stringify({
        info: 'true',
        success: true,
        warning: 1,
        error: null,
        debug: false,
        unknown: true,
      }),
    );

    expect(result.info).toBe(false);
    expect(result.success).toBe(true);
    expect(result.warning).toBe(true);
    expect(result.error).toBe(true);
    expect(result.debug).toBe(false);
    expect(result).not.toHaveProperty('unknown');
  });

  it.each(['{', 'null', '[]', 'true', '"filters"'])(
    'returns defaults for corrupt or non-record payload %s',
    (saved) => {
      expect(parseToastTypeFilters(saved)).toEqual(DEFAULT_TOAST_TYPE_FILTERS);
    },
  );
});
