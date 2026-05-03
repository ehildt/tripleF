import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PanelEmptyState from './PanelEmptyState.vue';

describe('PanelEmptyState', () => {
  it('renders default message and submessage', () => {
    const wrapper = mount(PanelEmptyState);
    expect(wrapper.text()).toContain('No requests yet');
    expect(wrapper.text()).toContain('Send a request to see results');
  });

  it('renders custom message', () => {
    const wrapper = mount(PanelEmptyState, {
      props: { message: 'Waiting...' },
    });
    expect(wrapper.text()).toContain('Waiting...');
    expect(wrapper.text()).toContain('Send a request to see results');
  });

  it('renders custom submessage', () => {
    const wrapper = mount(PanelEmptyState, {
      props: { submessage: 'Please wait' },
    });
    expect(wrapper.text()).toContain('Please wait');
  });
});
