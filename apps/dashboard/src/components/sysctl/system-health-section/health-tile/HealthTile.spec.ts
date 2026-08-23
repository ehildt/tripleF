import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import HealthTile from './HealthTile.vue';

describe('HealthTile', () => {
  it('renders name and status', () => {
    const wrapper = mount(HealthTile, {
      props: { name: 'ollama', status: 'up', loading: false, error: false },
    });
    expect(wrapper.text()).toContain('ollama');
    expect(wrapper.text()).toContain('up');
  });

  it('shows "..." while loading', () => {
    const wrapper = mount(HealthTile, {
      props: { name: 'ollama', status: '', loading: true, error: false },
    });
    expect(wrapper.text()).toContain('...');
  });

  it('shows "ERR" when in error state', () => {
    const wrapper = mount(HealthTile, {
      props: { name: 'ollama', status: 'down', loading: false, error: true },
    });
    expect(wrapper.text()).toContain('ERR');
  });
});
