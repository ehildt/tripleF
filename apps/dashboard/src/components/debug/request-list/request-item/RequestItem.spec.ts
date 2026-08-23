import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RequestItem from './RequestItem.vue';

describe('RequestItem', () => {
  it('renders endpoint and method', () => {
    const wrapper = mount(RequestItem, {
      props: {
        result: {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          endpoint: '/api/v1/harness',
          method: 'POST',
          status: 'success',
          responseTime: 42,
          type: 'http',
          direction: 'request',
        },
      },
    });
    expect(wrapper.text()).toContain('/api/v1/harness');
    expect(wrapper.text()).toContain('POST');
  });

  it('renders error state differently', () => {
    const wrapper = mount(RequestItem, {
      props: {
        result: {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          endpoint: '/api/v1/harness',
          method: 'POST',
          status: 'error',
          responseTime: 10,
          type: 'http',
          errorMessage: 'fail',
        },
      },
    });
    expect(wrapper.text()).toContain('/api/v1/harness');
    expect(wrapper.text()).toContain('POST');
  });
});
