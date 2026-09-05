import { beforeEach, describe, expect, it } from 'vitest';

import { useSettingsTab } from './use-settings-tab';

const STORAGE_KEY = 'vision-settings-tab';

describe('useSettingsTab', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens on the integrations tab by default', () => {
    const { activeSettingsTab } = useSettingsTab();
    expect(activeSettingsTab.value).toBe('integrations');
  });

  it('persists the selected tab', () => {
    const { activeSettingsTab, selectSettingsTab } = useSettingsTab();
    selectSettingsTab('widgets');
    expect(activeSettingsTab.value).toBe('widgets');
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
      const { activeSettingsTab } = useSettingsTab();
      expect(activeSettingsTab.value).toBe(expected);
    },
  );
});
