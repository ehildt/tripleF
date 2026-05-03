import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ClaheMaxSlopeInput from './ClaheMaxSlopeInput.vue';

describe('ClaheMaxSlopeInput', () => {
  it('renders with step 0.1 and placeholder 3.0', () => {
    const wrapper = mount(ClaheMaxSlopeInput, {
      props: { modelValue: 3.0 },
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).step).toBe('0.1');
    expect((input.element as HTMLInputElement).placeholder).toBe('3.0');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(ClaheMaxSlopeInput, {
      props: { modelValue: 3.0 },
    });
    const input = wrapper.find('input');
    await input.setValue('4.5');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
