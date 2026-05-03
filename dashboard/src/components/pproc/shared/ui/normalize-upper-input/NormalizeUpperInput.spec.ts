import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NormalizeUpperInput from './NormalizeUpperInput.vue';

describe('NormalizeUpperInput', () => {
  it('renders with placeholder 99', () => {
    const wrapper = mount(NormalizeUpperInput, {
      props: { modelValue: 99 },
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).placeholder).toBe('99');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(NormalizeUpperInput, {
      props: { modelValue: 99 },
    });
    const input = wrapper.find('input');
    await input.setValue('95');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
