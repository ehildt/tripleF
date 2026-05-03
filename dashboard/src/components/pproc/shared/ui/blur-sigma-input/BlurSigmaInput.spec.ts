import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BlurSigmaInput from './BlurSigmaInput.vue';

describe('BlurSigmaInput', () => {
  it('renders with step 0.1 and placeholder 0.5', () => {
    const wrapper = mount(BlurSigmaInput, {
      props: { modelValue: 0.5 },
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).step).toBe('0.1');
    expect((input.element as HTMLInputElement).placeholder).toBe('0.5');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(BlurSigmaInput, {
      props: { modelValue: 0.5 },
    });
    const input = wrapper.find('input');
    await input.setValue('1.5');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
