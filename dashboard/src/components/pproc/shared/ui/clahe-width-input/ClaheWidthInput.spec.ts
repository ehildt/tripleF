import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ClaheWidthInput from './ClaheWidthInput.vue';

describe('ClaheWidthInput', () => {
  it('renders with placeholder 8', () => {
    const wrapper = mount(ClaheWidthInput, {
      props: { modelValue: 8 },
    });
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).placeholder).toBe('8');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(ClaheWidthInput, {
      props: { modelValue: 8 },
    });
    const input = wrapper.find('input');
    await input.setValue('16');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });
});
