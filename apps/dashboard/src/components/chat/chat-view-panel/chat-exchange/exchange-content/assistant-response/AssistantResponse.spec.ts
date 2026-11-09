import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useTemplatePartsSettingsStore } from '@/stores/template-parts-settings/template-parts-settings.store';
import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import AssistantResponse from './AssistantResponse.vue';

function mountAssistantResponse(
  template: string,
  data?: AssistantResponseData,
  text?: string,
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(AssistantResponse, {
    global: { plugins: [pinia] },
    props: { template, data, text },
  });
}

describe('AssistantResponse', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('renders the text template', () => {
    const wrapper = mountAssistantResponse('text', undefined, 'Hello world');
    expect(wrapper.find('.text-response').text()).toBe('Hello world');
  });

  it('renders the describe template', () => {
    const wrapper = mountAssistantResponse('describe', { title: 'Image' });
    expect(wrapper.find('.describe-response').exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('Image');
  });

  it('renders the compare template', () => {
    const wrapper = mountAssistantResponse('compare', { title: 'Compare' });
    expect(wrapper.find('.compare-response').exists()).toBe(true);
  });

  it('renders the ocr template', () => {
    const wrapper = mountAssistantResponse('ocr', { title: 'OCR' });
    expect(wrapper.find('.ocr-response').exists()).toBe(true);
  });

  it('renders the news template', () => {
    const wrapper = mountAssistantResponse('news', { headline: 'News' });
    expect(wrapper.find('.news-response').exists()).toBe(true);
  });

  it('renders the article template', () => {
    const wrapper = mountAssistantResponse('article', { title: 'Article' });
    expect(wrapper.find('.article-response').exists()).toBe(true);
  });

  it('reactively removes disabled template parts without changing other content', async () => {
    const wrapper = mountAssistantResponse('article', {
      title: 'Article',
      quote: 'A removable quote',
      conclusion: 'The conclusion remains',
    });
    expect(wrapper.text()).toContain('A removable quote');

    useTemplatePartsSettingsStore().setTemplatePartVisible(
      'article',
      'quote',
      false,
    );
    await nextTick();

    expect(wrapper.text()).not.toContain('A removable quote');
    expect(wrapper.text()).toContain('The conclusion remains');
  });

  it('renders nothing for an unknown template', () => {
    const wrapper = mountAssistantResponse('unknown', {});
    expect(wrapper.element.tagName).toBeUndefined();
  });
});
