import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MaxHeightField from './MaxHeightField.vue';

describe('MaxHeightField', () => {
  it('renders Max Height label', () => {
    const wrapper = mount(MaxHeightField, {
      props: { modelValue: 768 },
    });
    expect(wrapper.text()).toContain('Max Height');
  });

  it('emits null for AUTO selection', async () => {
    const wrapper = mount(MaxHeightField, {
      props: { modelValue: 768 },
    });
    const button = wrapper.find('button');
    await button.trigger('click');
    const options = wrapper.findAll('li');
    const autoOption = options.find((o) => o.text().includes('AUTO'));
    if (autoOption) await autoOption.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([null]);
  });

  it('emits parsed number for size selection', async () => {
    const wrapper = mount(MaxHeightField, {
      props: { modelValue: null },
    });
    const button = wrapper.find('button');
    await button.trigger('click');
    const options = wrapper.findAll('li');
    const sizeOption = options.find((o) => o.text().includes('768'));
    if (sizeOption) await sizeOption.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([768]);
  });

  it('uses AUTO placeholder when value is null', () => {
    const wrapper = mount(MaxHeightField, {
      props: { modelValue: null },
    });
    expect(wrapper.text()).toContain('AUTO');
  });
});
