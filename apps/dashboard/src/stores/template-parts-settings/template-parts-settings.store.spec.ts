import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEMPLATE_NAMES } from './template-parts-settings.constant';
import { useTemplatePartsSettingsStore } from './template-parts-settings.store';

describe('useTemplatePartsSettingsStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(store.isTemplatePartVisible('article', 'constructor')).toBe(true);
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
    store.setTemplatePartVisible('article', 'constructor', false);
    expect(JSON.stringify(store.templatePartsVisibility)).toBe(before);
    expect(localStorage.getItem('vision-template-parts')).toBeNull();
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

  it('uses pristine defaults for corrupt storage', () => {
    localStorage.setItem('vision-template-parts', '{');

    const store = useTemplatePartsSettingsStore();

    expect(store.isTemplatePartVisible('article', 'hero')).toBe(true);
    expect(store.isTemplatePartVisible('news', 'sources')).toBe(true);
  });

  it('uses defaults when storage reads are unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const store = useTemplatePartsSettingsStore();

    expect(store.isTemplatePartVisible('article', 'hero')).toBe(true);
  });

  it('keeps changes in memory when storage writes are unavailable', () => {
    const store = useTemplatePartsSettingsStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => {
      store.setTemplatePartVisible('article', 'hero', false);
      store.resetTemplateParts();
    }).not.toThrow();
    expect(store.isTemplatePartVisible('article', 'hero')).toBe(true);
  });

  it('resets every part back to enabled', () => {
    const store = useTemplatePartsSettingsStore();
    store.setTemplatePartVisible('article', 'hero', false);
    store.resetTemplateParts();
    expect(store.isTemplatePartVisible('article', 'hero')).toBe(true);
  });
});
