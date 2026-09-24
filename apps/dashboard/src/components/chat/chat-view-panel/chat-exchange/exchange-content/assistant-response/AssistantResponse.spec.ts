import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import AssistantResponse from './AssistantResponse.vue';

function mountAssistantResponse(
  template: string,
  data?: Record<string, unknown>,
  text?: string,
) {
  return mount(AssistantResponse, {
    global: { plugins: [createPinia()] },
    props: { template, data: data as any, text },
  });
}

describe('AssistantResponse', () => {
  it('renders the text template', () => {
    const wrapper = mountAssistantResponse('text', undefined, 'Hello world');
    expect(wrapper.find('.response-container').text()).toBe('Hello world');
  });

  it('renders the describe template', () => {
    const wrapper = mountAssistantResponse('describe', { title: 'Image' });
    expect(wrapper.find('.harness-describe').exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('Image');
  });

  it('renders the compare template', () => {
    const wrapper = mountAssistantResponse('compare', { title: 'Compare' });
    expect(wrapper.find('.harness-compare').exists()).toBe(true);
  });

  it('renders the ocr template', () => {
    const wrapper = mountAssistantResponse('ocr', { title: 'OCR' });
    expect(wrapper.find('.harness-ocr').exists()).toBe(true);
  });

  it('renders the news template', () => {
    const wrapper = mountAssistantResponse('news', { headline: 'News' });
    expect(wrapper.find('.news').exists()).toBe(true);
  });

  it('renders the article template', () => {
    const wrapper = mountAssistantResponse('article', { title: 'Article' });
    expect(wrapper.find('.article').exists()).toBe(true);
  });

  it('renders nothing for an unknown template', () => {
    const wrapper = mountAssistantResponse('unknown', {});
    expect(wrapper.element.tagName).toBeUndefined();
  });
});
