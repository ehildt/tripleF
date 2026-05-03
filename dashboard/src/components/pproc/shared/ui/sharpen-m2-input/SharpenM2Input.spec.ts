import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SharpenM2Input from './SharpenM2Input.vue';

describe('SharpenM2Input', () => {
  it('renders with step 0.1 and placeholder 2.0', () => {
    const wrapper = mount(SharpenM2Input, {
      props: { modelValue: 2.0 },
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).step).toBe('0.1');
    expect((input.element as HTMLInputElement).placeholder).toBe('2.0');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(SharpenM2Input, {
      props: { modelValue: 2.0 },
    });
    const input = wrapper.find('input');
    await input.setValue('3.5');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
