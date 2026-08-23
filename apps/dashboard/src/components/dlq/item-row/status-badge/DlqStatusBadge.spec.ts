import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DlqStatusBadge from './DlqStatusBadge.vue';

describe('DlqStatusBadge', () => {
  it('renders the status text', () => {
    const wrapper = mount(DlqStatusBadge, {
      props: { status: 'Failed' },
    });
    expect(wrapper.text()).toBe('Failed');
  });

  it('applies the success class for Active entries', () => {
    const wrapper = mount(DlqStatusBadge, {
      props: { status: 'Active' },
    });
    expect(wrapper.classes().join(' ')).toContain('status-success');
  });
});
