import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppFooter from './AppFooter.vue';

describe('AppFooter', () => {
  it('renders version and endpoints', () => {
    const wrapper = mount(AppFooter, {
      props: { connectionState: 'disconnected' },
    });
    expect(wrapper.text()).toContain('v1.3.0');
    expect(wrapper.text()).toContain('/api/v1/harness');
  });

  it.each([
    ['connected', 'CONNECTED'],
    ['disconnected', 'DISCONNECTED'],
    ['error', 'ERROR'],
  ] as const)('shows %s state', (state, expectedText) => {
    const wrapper = mount(AppFooter, {
      props: { connectionState: state },
    });
    expect(wrapper.text()).toContain(expectedText);
  });

  it('shows socketId when provided', () => {
    const wrapper = mount(AppFooter, {
      props: { connectionState: 'connected', socketId: 'abc-123' },
    });
    expect(wrapper.text()).toContain('abc-123');
  });

  it('shows connected pairs when provided', () => {
    const wrapper = mount(AppFooter, {
      props: {
        connectionState: 'connected',
        connectedPairs: ['harness', 'harness::room1'],
      },
    });
    expect(wrapper.text()).toContain('connected:');
    expect(wrapper.text()).toContain('harness');
    expect(wrapper.text()).toContain('harness::room1');
  });

  it('does not show connected pairs when empty', () => {
    const wrapper = mount(AppFooter, {
      props: { connectionState: 'connected', connectedPairs: [] },
    });
    expect(wrapper.text()).not.toContain('connected:');
  });
});
