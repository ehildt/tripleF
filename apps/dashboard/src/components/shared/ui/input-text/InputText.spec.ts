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
    expect(input.classes()).toContain('input-text__field');
    expect(input.classes()).toContain('input-text__field--disabled');
  });

  it('applies the borderless modifier for the borderless variant', () => {
    const wrapper = mount(InputText, {
      props: { modelValue: '', variant: 'borderless' },
    });
    expect(wrapper.find('input').classes()).toContain(
      'input-text__field--borderless',
    );
  });

  it('defaults to the boxed variant without the borderless modifier', () => {
    const wrapper = mount(InputText, { props: { modelValue: '' } });
    expect(wrapper.find('input').classes()).not.toContain(
      'input-text__field--borderless',
    );
  });

  it('emits change with the native event', async () => {
    const wrapper = mount(InputText, { props: { modelValue: '' } });
    await wrapper.find('input').trigger('change');
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  it('emits focus with the native event', async () => {
    const wrapper = mount(InputText, { props: { modelValue: '' } });
    await wrapper.find('input').trigger('focus');
    expect(wrapper.emitted('focus')).toBeTruthy();
  });

  it('passes autocomplete and spellcheck through to the input', () => {
    const wrapper = mount(InputText, {
      props: { modelValue: '', autocomplete: 'off', spellcheck: false },
    });
    const input = wrapper.find('input');
    expect(input.attributes('autocomplete')).toBe('off');
    expect(input.attributes('spellcheck')).toBe('false');
  });
});
