import { beforeEach, describe, expect, it } from 'vitest';

import { useSysctlTab } from './use-sysctl-tab';

const STORAGE_KEY = 'vision-sysctl-tab';

describe('useSysctlTab', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens on the integrations tab by default', () => {
    const { activeSysctlTab } = useSysctlTab();
    expect(activeSysctlTab.value).toBe('integrations');
  });

  it('persists the selected tab', () => {
    const { activeSysctlTab, selectSysctlTab } = useSysctlTab();
    selectSysctlTab('widgets');
    expect(activeSysctlTab.value).toBe('widgets');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('widgets');
  });

  it.each([
    ['interface', 'interface'],
    ['popout', 'widgets'],
    ['search-engines', 'integrations'],
    ['nope', 'integrations'],
  ] as const)(
    'restores saved "%s" as "%s" (migrating legacy/unknown values)',
    (saved, expected) => {
      localStorage.setItem(STORAGE_KEY, saved);
      const { activeSysctlTab } = useSysctlTab();
      expect(activeSysctlTab.value).toBe(expected);
    },
  );
});
