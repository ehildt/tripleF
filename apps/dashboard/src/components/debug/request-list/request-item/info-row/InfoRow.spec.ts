import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InfoRow from './InfoRow.vue';

describe('InfoRow', () => {
  it('renders method badge and endpoint for http', () => {
    const wrapper = mount(InfoRow, {
      props: { method: 'POST', type: 'http', endpoint: '/api/v1/harness' },
    });
    expect(wrapper.text()).toContain('POST');
    expect(wrapper.text()).toContain('/api/v1/harness');
  });

  it('renders method and requestId for socket', () => {
    const wrapper = mount(InfoRow, {
      props: {
        method: 'GET',
        type: 'socket',
        event: 'harness',
        roomId: 'room-1',
        requestId: 'req-1',
      },
    });
    expect(wrapper.text()).toContain('GET');
    expect(wrapper.text()).toContain('req-1');
  });
});
