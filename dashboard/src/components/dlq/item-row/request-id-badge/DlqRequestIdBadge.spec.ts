import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DlqRequestIdBadge from './DlqRequestIdBadge.vue';

describe('DlqRequestIdBadge', () => {
  it('renders the request id', () => {
    const wrapper = mount(DlqRequestIdBadge, {
      props: { jobName: 'req-1' },
    });
    expect(wrapper.text()).toBe('req-1');
  });
});
