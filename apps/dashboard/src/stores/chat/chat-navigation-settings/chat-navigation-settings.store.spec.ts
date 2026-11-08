import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useChatNavigationSettingsStore } from './chat-navigation-settings.store';

describe('useChatNavigationSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('defaults to carousel', () => {
    expect(useChatNavigationSettingsStore().defaultScrollMode).toBe('carousel');
  });

  it('updates the global scroll default', () => {
    const store = useChatNavigationSettingsStore();
    store.setDefaultScrollMode('native');
    expect(store.defaultScrollMode).toBe('native');
  });

  it('inherits the global scroll default and accepts per-conversation overrides', () => {
    const store = useChatNavigationSettingsStore();
    store.setDefaultScrollMode('native');
    expect(store.getConversationScrollMode('conv-1')).toBe('native');

    store.setConversationScrollMode('conv-1', 'carousel');
    expect(store.getConversationScrollMode('conv-1')).toBe('carousel');
    expect(store.getConversationScrollMode('conv-2')).toBe('native');
  });

  it('defaults every chat action icon to visible', () => {
    expect(useChatNavigationSettingsStore().chatIconVisibility).toEqual({
      copy: true,
      include: true,
      branch: true,
      delete: true,
    });
  });

  it('changes one chat icon without changing the others', () => {
    const store = useChatNavigationSettingsStore();
    store.setChatIconVisibility('copy', false);
    expect(store.chatIconVisibility.copy).toBe(false);
    expect(store.chatIconVisibility.include).toBe(true);
  });
});
