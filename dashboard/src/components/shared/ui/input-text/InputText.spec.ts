import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InputText from './InputText.vue';

describe('InputText', () => {
  it('renders with placeholder', () => {
    const wrapper = mount(InputText, {
      props: { modelValue: '', placeholder: 'Enter text' },
    });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Enter text');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(InputText, {
      props: { modelValue: '' },
    });
    const input = wrapper.find('input');
    await input.setValue('hello');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello']);
  });

  it('reflects modelValue prop', () => {
    const wrapper = mount(InputText, {
      props: { modelValue: 'initial' },
    });
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe('initial');
  });

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(InputText, {
      props: { modelValue: '', disabled: true },
    });
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
    expect(input.classes().join(' ')).toContain('disabled:opacity-50');
  });
});
