import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SystemHealthSection from './SystemHealthSection.vue';

describe('SystemHealthSection', () => {
  const tiles = [
    { key: 'disk', status: 'up', loading: false, error: false },
    { key: 'ollama', status: 'down', loading: false, error: true },
  ];

  it('renders one tile per item', () => {
    const wrapper = mount(SystemHealthSection, {
      props: { tiles },
    });
    expect(wrapper.findAllComponents({ name: 'HealthTile' })).toHaveLength(2);
  });
});
