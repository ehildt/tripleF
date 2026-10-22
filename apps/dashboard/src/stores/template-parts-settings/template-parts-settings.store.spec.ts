import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { TEMPLATE_NAMES } from './template-parts-settings.constant';
import { useTemplatePartsSettingsStore } from './template-parts-settings.store';

describe('useTemplatePartsSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('starts with every part enabled', () => {
    const store = useTemplatePartsSettingsStore();
    for (const template of TEMPLATE_NAMES) {
      for (const value of Object.values(
        store.templatePartsVisibility[template],
      )) {
        expect(value).toBe(true);
      }
    }
  });

  it('defaults unknown parts and templates to visible', () => {
    const store = useTemplatePartsSettingsStore();
    expect(store.isTemplatePartVisible('article', 'hero')).toBe(true);
    expect(store.isTemplatePartVisible('article', 'not-a-part')).toBe(true);
    expect(store.isTemplatePartVisible('not-a-template', 'x')).toBe(true);
  });

  it('sets and toggles a part', () => {
    const store = useTemplatePartsSettingsStore();
    store.setTemplatePartVisible('article', 'hero', false);
    expect(store.isTemplatePartVisible('article', 'hero')).toBe(false);

    store.toggleTemplatePartVisible('article', 'hero');
    expect(store.isTemplatePartVisible('article', 'hero')).toBe(true);
  });

  it('ignores writes for unknown parts', () => {
    const store = useTemplatePartsSettingsStore();
    const before = JSON.stringify(store.templatePartsVisibility);
    store.setTemplatePartVisible('article', 'nope', false);
    expect(JSON.stringify(store.templatePartsVisibility)).toBe(before);
  });

  it('persists visibility to storage', () => {
    const store = useTemplatePartsSettingsStore();
    store.setTemplatePartVisible('article', 'hero', false);
    const saved = JSON.parse(
      localStorage.getItem('vision-template-parts') ?? '{}',
    );
    expect(saved.article.hero).toBe(false);
  });

  it('hydrates a persisted override', () => {
    localStorage.setItem(
      'vision-template-parts',
      JSON.stringify({ article: { hero: false } }),
    );
    const store = useTemplatePartsSettingsStore();
    expect(store.isTemplatePartVisible('article', 'hero')).toBe(false);
  });

  it('resets every part back to enabled', () => {
    const store = useTemplatePartsSettingsStore();
    store.setTemplatePartVisible('article', 'hero', false);
    store.resetTemplateParts();
    expect(store.isTemplatePartVisible('article', 'hero')).toBe(true);
  });
});
