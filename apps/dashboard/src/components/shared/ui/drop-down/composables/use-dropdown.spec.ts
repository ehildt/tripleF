import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import { useDropdown } from './use-dropdown';

const TestDropdown = defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null);
    const selected = ref('');

    const { open, toggle, select, close } = useDropdown(
      containerRef,
      (value: string) => {
        selected.value = value;
      },
      () => {},
      ref(props.disabled),
    );

    return { containerRef, open, toggle, select, close, selected };
  },
  template:
    '<div ref="containerRef"><button data-testid="toggle" @click="toggle">Toggle</button></div>',
});

describe('useDropdown', () => {
  it('starts closed', () => {
    const wrapper = mount(TestDropdown);
    expect(wrapper.vm.open).toBe(false);
  });

  it('toggles open state', async () => {
    const wrapper = mount(TestDropdown);
    await wrapper.find('[data-testid="toggle"]').trigger('click');
    expect(wrapper.vm.open).toBe(true);

    await wrapper.find('[data-testid="toggle"]').trigger('click');
    expect(wrapper.vm.open).toBe(false);
  });

  it('selects a value and closes', () => {
    const wrapper = mount(TestDropdown);
    wrapper.vm.select('apple');
    expect(wrapper.vm.selected).toBe('apple');
    expect(wrapper.vm.open).toBe(false);
  });

  it('closes explicitly', async () => {
    const wrapper = mount(TestDropdown);
    await wrapper.find('[data-testid="toggle"]').trigger('click');
    wrapper.vm.close();
    expect(wrapper.vm.open).toBe(false);
  });

  it('does not toggle when disabled', async () => {
    const wrapper = mount(TestDropdown, { props: { disabled: true } });
    await wrapper.find('[data-testid="toggle"]').trigger('click');
    expect(wrapper.vm.open).toBe(false);
  });
});
