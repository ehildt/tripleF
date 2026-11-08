import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePromptMenuSettingsStore } from './prompt-menu-settings.store';

describe('usePromptMenuSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('defaults both menus to expanded and always shown', () => {
    const store = usePromptMenuSettingsStore();
    expect(store.sourceTagsMenuCollapsed).toEqual({
      sources: false,
      view: false,
    });
    expect(store.sourceTagsMenuAlwaysShow).toEqual({
      sources: true,
      view: true,
    });
  });

  it('changes global collapse and always-show settings independently', () => {
    const store = usePromptMenuSettingsStore();
    store.setSourceTagsMenuCollapsed('sources', true);
    expect(store.sourceTagsMenuCollapsed).toEqual({
      sources: true,
      view: false,
    });

    store.setSourceTagsMenuAlwaysShow('view', false);
    expect(store.sourceTagsMenuAlwaysShow).toEqual({
      sources: true,
      view: false,
    });
  });

  it('falls back to global collapse settings and overrides one conversation', () => {
    const store = usePromptMenuSettingsStore();
    store.setSourceTagsMenuCollapsed('sources', true);
    expect(store.getSourceMenuCollapsed('conv-1', 'sources')).toBe(true);

    store.setSourceMenuCollapsed('conv-1', 'sources', false);
    store.setSourceMenuCollapsed('conv-1', 'view', true);
    expect(store.getSourceMenuCollapsed('conv-1', 'sources')).toBe(false);
    expect(store.getSourceMenuCollapsed('conv-1', 'view')).toBe(true);
    expect(store.getSourceMenuCollapsed('conv-2', 'sources')).toBe(true);
  });

  it('falls back to global always-show settings and overrides one conversation', () => {
    const store = usePromptMenuSettingsStore();
    store.setSourceTagsMenuAlwaysShow('sources', false);
    expect(store.getSourceMenuAlwaysShow('conv-1', 'sources')).toBe(false);

    store.setSourceMenuAlwaysShow('conv-1', 'view', false);
    expect(store.getSourceMenuAlwaysShow('conv-1', 'view')).toBe(false);
    expect(store.getSourceMenuAlwaysShow('conv-1', 'sources')).toBe(false);
    expect(store.getSourceMenuAlwaysShow('conv-2', 'view')).toBe(true);
  });
});
