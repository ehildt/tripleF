import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MaxWidthField from './MaxWidthField.vue';

describe('MaxWidthField', () => {
  it('renders the current size in the select', () => {
    const wrapper = mount(MaxWidthField, {
      props: { modelValue: 768 },
    });
    expect(wrapper.text()).toContain('768');
  });

  it('emits parsed PreprocessingSize on selection', async () => {
    const wrapper = mount(MaxWidthField, {
      props: { modelValue: 768 },
    });
    const button = wrapper.find('button');
    await button.trigger('click');
    const options = wrapper.findAll('li');
    const sizeOption = options.find((o) => o.text().includes('1024'));
    if (sizeOption) await sizeOption.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([1024]);
  });
});
