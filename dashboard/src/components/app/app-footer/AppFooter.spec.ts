import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import AppFooter from './AppFooter.vue';

function mountFooter(props: Record<string, unknown> = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(AppFooter, {
    props: { socketId: null, ...props },
    global: { plugins: [pinia] },
  });
}

describe('AppFooter', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows the full session id when connected', () => {
    const wrapper = mountFooter({ socketId: 'abc-123-full-session-id' });
    expect(wrapper.text()).toContain('abc-123-full-session-id');
  });

  it('shows a placeholder when there is no session', () => {
    const wrapper = mountFooter({ socketId: null });
    expect(wrapper.text()).toContain('—');
  });

  it('disables the copy button without a session', () => {
    const wrapper = mountFooter({ socketId: null });
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });
});
