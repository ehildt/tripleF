import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAssistantResponseSettingsStore } from './assistant-response-settings.store';

describe('useAssistantResponseSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('defaults media priority to images and supports overrides', () => {
    const store = useAssistantResponseSettingsStore();
    expect(store.defaultMediaPriority).toBe('images');

    store.setDefaultMediaPriority('videos');
    expect(store.getConversationMediaPriority('conv-1')).toBe('videos');
    store.setConversationMediaPriority('conv-1', 'images');
    expect(store.getConversationMediaPriority('conv-1')).toBe('images');
    expect(store.getConversationMediaPriority('conv-2')).toBe('videos');
  });

  it('defaults every response section to expanded and toggles one section', () => {
    const store = useAssistantResponseSettingsStore();
    expect(store.collapsedSections).toEqual({
      sources: false,
      keyFindings: false,
      internationalCoverage: false,
    });

    store.setSectionCollapsed('sources', true);
    expect(store.collapsedSections.sources).toBe(true);
    store.toggleSectionCollapsed('sources');
    expect(store.collapsedSections.sources).toBe(false);
    expect(store.collapsedSections.keyFindings).toBe(false);
  });

  it('defaults and changes media presentations independently', () => {
    const store = useAssistantResponseSettingsStore();
    expect(store.mediaPresentations).toEqual({
      image: 'gallery',
      video: 'list',
    });

    store.setMediaPresentation('video', 'gallery');
    expect(store.mediaPresentations.video).toBe('gallery');
    expect(store.mediaPresentations.image).toBe('gallery');
    store.toggleMediaPresentation('image');
    expect(store.mediaPresentations.image).toBe('list');
    expect(store.mediaPresentations.video).toBe('gallery');
  });
});
