import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InputTextArea from './InputTextArea.vue';

describe('InputTextArea', () => {
  it('renders with modelValue', () => {
    const wrapper = mount(InputTextArea, { props: { modelValue: 'hello' } });
    expect(
      (wrapper.find('textarea').element as HTMLTextAreaElement).value,
    ).toBe('hello');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(InputTextArea, { props: { modelValue: '' } });
    const textarea = wrapper.find('textarea');
    await textarea.setValue('world');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['world']);
  });

  it('uses default rows of 3', () => {
    const wrapper = mount(InputTextArea, { props: { modelValue: '' } });
    expect(wrapper.find('textarea').attributes('rows')).toBe('3');
  });

  it('accepts custom rows', () => {
    const wrapper = mount(InputTextArea, {
      props: { modelValue: '', rows: 5 },
    });
    expect(wrapper.find('textarea').attributes('rows')).toBe('5');
  });

  it('applies disabled styling', () => {
    const wrapper = mount(InputTextArea, {
      props: { modelValue: '', disabled: true },
    });
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
  });
});
