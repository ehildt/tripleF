import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BrightnessInput from './BrightnessInput.vue';

describe('BrightnessInput', () => {
  it('renders with step 0.1 and placeholder 1.2', () => {
    const wrapper = mount(BrightnessInput, {
      props: { modelValue: 1.2 },
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).step).toBe('0.1');
    expect((input.element as HTMLInputElement).placeholder).toBe('1.2');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(BrightnessInput, {
      props: { modelValue: 1.0 },
    });
    const input = wrapper.find('input');
    await input.setValue('2.5');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
