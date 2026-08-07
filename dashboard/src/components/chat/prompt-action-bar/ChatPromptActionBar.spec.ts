import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ChatPromptActionBar from './ChatPromptActionBar.vue';

function mountComponent(props = {}) {
  return mount(ChatPromptActionBar, {
    props: {
      value: '',
      thinkOptions: ['off', 'medium'],
      thinkValue: 'medium',
      contextSizeOptions: ['4096'],
      contextSizeValue: '4096',
      defaultContextSize: '4096',
      formatContextSize: (value: string) => value,
      isDisabled: false,
      isFileSelectDisabled: false,
      fileSelectDisabledReason: undefined,
      setActionBarRef: vi.fn(),
      setThinkDropdownRef: vi.fn(),
      setContextSizeDropdownRef: vi.fn(),
      ...props,
    },
  });
}

describe('ChatPromptActionBar', () => {
  it('renders a textarea', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('reflects the value prop on the textarea', () => {
    const wrapper = mountComponent({ value: 'hello' });
    const textarea = wrapper.find('textarea');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('hello');
  });

  it('emits input on textarea input', async () => {
    const wrapper = mountComponent();
    const textarea = wrapper.find('textarea');
    await textarea.setValue('hello');
    expect(wrapper.emitted('input')).toBeTruthy();
  });

  it('emits keydown on textarea keydown', async () => {
    const wrapper = mountComponent();
    const textarea = wrapper.find('textarea');
    await textarea.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('keydown')).toBeTruthy();
  });

  it('emits fileSelect when the file button is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper.find('button[aria-label="Select files"]').trigger('click');
    expect(wrapper.emitted('fileSelect')).toBeTruthy();
  });

  it('disables the file button when isFileSelectDisabled is true', () => {
    const wrapper = mountComponent({ isFileSelectDisabled: true });
    const button = wrapper.find('button[aria-label="Select files"]');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('shows a custom title when fileSelectDisabledReason is provided', () => {
    const wrapper = mountComponent({
      isFileSelectDisabled: true,
      fileSelectDisabledReason: 'No vision support',
    });
    const button = wrapper.findAll('button').at(-1);
    expect(button.attributes('aria-label')).toBe('No vision support');
  });

  it('emits disabledHoverStart and disabledHoverEnd when file select is disabled', async () => {
    const wrapper = mountComponent({ isFileSelectDisabled: true });
    const button = wrapper.find('button[aria-label="Select files"]');

    button.element.dispatchEvent(new MouseEvent('mouseenter'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('disabledHoverStart')).toBeTruthy();

    button.element.dispatchEvent(new MouseEvent('mouseleave'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('disabledHoverEnd')).toBeTruthy();
  });

  it('hides the search engine indicator by default', () => {
    const wrapper = mountComponent();
    expect(
      wrapper.find('.chat-prompt-action-bar__offline-indicator').exists(),
    ).toBe(false);
    expect(
      wrapper.find('.chat-prompt-action-bar__search-toggle').exists(),
    ).toBe(false);
  });

  it('shows the non-interactive globe-off indicator when no search engine is configured', () => {
    const wrapper = mountComponent({ searchEngineState: 'unavailable' });
    const indicator = wrapper.find(
      '.chat-prompt-action-bar__offline-indicator',
    );
    expect(indicator.exists()).toBe(true);
    expect(indicator.attributes('aria-label')).toContain('No search engine');
    expect(indicator.attributes('aria-label')).toBe(
      'No search engine connected',
    );
    expect(indicator.element.tagName).toBe('SPAN');
  });

  it('shows a globe toggle when the search engine is enabled and emits on click', async () => {
    const wrapper = mountComponent({ searchEngineState: 'enabled' });
    const toggle = wrapper.find('.chat-prompt-action-bar__search-toggle');
    expect(toggle.exists()).toBe(true);
    expect(toggle.attributes('aria-label')).toContain('click to disable');

    await toggle.trigger('click');
    expect(wrapper.emitted('toggleSearchEngine')).toBeTruthy();
  });

  it('shows a globe-off toggle when the search engine is disabled and emits on click', async () => {
    const wrapper = mountComponent({ searchEngineState: 'disabled' });
    const toggle = wrapper.find('.chat-prompt-action-bar__search-toggle');
    expect(toggle.exists()).toBe(true);
    expect(toggle.attributes('aria-label')).toContain('click to enable');

    await toggle.trigger('click');
    expect(wrapper.emitted('toggleSearchEngine')).toBeTruthy();
  });

  it('shows all source tags colored by state while a search engine is enabled', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [
        { key: 'web', enabled: true },
        { key: 'news', enabled: false },
      ],
    });
    const tags = wrapper.findAll('.chat-prompt-action-bar__source-tag');
    expect(tags.map((tag) => tag.attributes('aria-label'))).toEqual([
      'web source enabled — click to disable',
      'news source disabled — click to enable',
    ]);
    expect(tags[0].classes()).not.toContain(
      'chat-prompt-action-bar__source-tag--disabled',
    );
    expect(tags[1].classes()).toContain(
      'chat-prompt-action-bar__source-tag--disabled',
    );
  });

  it('emits toggleSource when a source tag is clicked', async () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [
        { key: 'web', enabled: true },
        { key: 'news', enabled: false },
      ],
    });
    const tags = wrapper.findAll('.chat-prompt-action-bar__source-tag');
    await tags[1].trigger('click');
    expect(wrapper.emitted('toggleSource')).toEqual([['news']]);
  });

  it('hides source tags when the kill switch disables the engine', () => {
    const wrapper = mountComponent({
      searchEngineState: 'disabled',
      searchSources: [{ key: 'web', enabled: true }],
    });
    expect(wrapper.find('.chat-prompt-action-bar__source-tag').exists()).toBe(
      false,
    );
  });

  it('hides source tags when no search engine is available', () => {
    const wrapper = mountComponent({
      searchEngineState: 'unavailable',
      searchSources: [{ key: 'web', enabled: true }],
    });
    expect(wrapper.find('.chat-prompt-action-bar__source-tag').exists()).toBe(
      false,
    );
  });

  it('falls back to a distinct Search icon for unknown future sources', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [{ key: 'videos', enabled: true }],
    });
    expect(
      wrapper.find('.chat-prompt-action-bar__source-tag-icon').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('.chat-prompt-action-bar__source-tag')
        .attributes('aria-label'),
    ).toContain('videos source enabled');
  });
});
