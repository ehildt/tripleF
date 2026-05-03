import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';

import Pproc from './Pproc.vue';

vi.mock('./tools-panel/PprocToolsPanel.vue', () => ({
  default: {
    template: '<div class="tools-panel">Tools</div>',
  },
}));
vi.mock('./options-panel/PprocOptionsPanel.vue', () => ({
  default: {
    template: '<div class="options-panel">Options</div>',
  },
}));

let activePinia: ReturnType<typeof createPinia>;

function mountPproc() {
  return mount(
    Pproc as Component,
    {
      global: { plugins: [activePinia] },
    } as any,
  );
}

describe('Pproc', () => {
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
  });

  it('renders the tools panel', () => {
    const wrapper = mountPproc();
    expect(wrapper.find('.tools-panel').exists()).toBe(true);
  });

  it('renders the options panel', () => {
    const wrapper = mountPproc();
    expect(wrapper.find('.options-panel').exists()).toBe(true);
  });
});
