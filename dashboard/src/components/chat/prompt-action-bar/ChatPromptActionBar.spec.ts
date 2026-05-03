import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ChatPromptActionBar from './ChatPromptActionBar.vue';

function mountComponent(props = {}) {
  return mount(ChatPromptActionBar, {
    props: {
      value: '',
      isCompacting: false,
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

  it('disables the textarea when isCompacting is true', () => {
    const wrapper = mountComponent({ isCompacting: true });
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
  });

  it('emits fileSelect when the file button is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper.find('button[title="Select files"]').trigger('click');
    expect(wrapper.emitted('fileSelect')).toBeTruthy();
  });

  it('disables the file button when isFileSelectDisabled is true', () => {
    const wrapper = mountComponent({ isFileSelectDisabled: true });
    const button = wrapper.find('button[title="Select files"]');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('shows a custom title when fileSelectDisabledReason is provided', () => {
    const wrapper = mountComponent({
      isFileSelectDisabled: true,
      fileSelectDisabledReason: 'No vision support',
    });
    const button = wrapper.findAll('button').at(-1);
    expect(button.attributes('title')).toBe('No vision support');
  });

  it('emits disabledHoverStart and disabledHoverEnd when file select is disabled', async () => {
    const wrapper = mountComponent({ isFileSelectDisabled: true });
    const button = wrapper.find('button[title="Select files"]');

    button.element.dispatchEvent(new MouseEvent('mouseenter'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('disabledHoverStart')).toBeTruthy();

    button.element.dispatchEvent(new MouseEvent('mouseleave'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('disabledHoverEnd')).toBeTruthy();
  });
});
