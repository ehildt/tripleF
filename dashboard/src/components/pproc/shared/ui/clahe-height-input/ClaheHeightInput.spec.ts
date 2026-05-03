import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ClaheHeightInput from './ClaheHeightInput.vue';

describe('ClaheHeightInput', () => {
  it('renders with placeholder 8', () => {
    const wrapper = mount(ClaheHeightInput, {
      props: { modelValue: 8 },
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).placeholder).toBe('8');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(ClaheHeightInput, {
      props: { modelValue: 8 },
    });
    const input = wrapper.find('input');
    await input.setValue('16');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
