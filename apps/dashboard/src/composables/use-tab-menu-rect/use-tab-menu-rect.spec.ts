import { beforeEach, describe, expect, it } from 'vitest';

import { useTabMenuRect } from './use-tab-menu-rect';

describe('useTabMenuRect', () => {
  beforeEach(() => {
    // Module-scope singleton: reset between tests.
    useTabMenuRect().reportTabMenuRect({ left: 0, width: 0 });
  });

  it('starts unpositioned (0/0) so consumers render nothing', () => {
    expect(useTabMenuRect().tabMenuRect.value).toEqual({ left: 0, width: 0 });
  });

  it('shares the reported rect across every caller', () => {
    useTabMenuRect().reportTabMenuRect({ left: 24, width: 320 });
    expect(useTabMenuRect().tabMenuRect.value).toEqual({
      left: 24,
      width: 320,
    });
  });

  it('accepts an updated rect (the menu re-measures itself)', () => {
    const rect = useTabMenuRect();
    rect.reportTabMenuRect({ left: 10, width: 100 });
    rect.reportTabMenuRect({ left: 48, width: 300 });
    expect(rect.tabMenuRect.value).toEqual({ left: 48, width: 300 });
  });
});
