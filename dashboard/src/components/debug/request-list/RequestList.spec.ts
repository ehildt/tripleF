import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import RequestList from './RequestList.vue';

describe('RequestList', () => {
  it('renders results list', () => {
    setActivePinia(createPinia());
    const wrapper = mount(RequestList, {
      props: {
        results: [
          {
            id: '1',
            timestamp: '2024-01-01T00:00:00Z',
            endpoint: '/api',
            method: 'GET',
            status: 'success',
            responseTime: 100,
            type: 'http',
            direction: 'request',
          },
        ],
        selectedResultId: '',
        isRead: () => false,
      },
    });
    expect(wrapper.text()).toContain('/api');
    expect(wrapper.text()).toContain('GET');
  });

  it('emits select with result on click', async () => {
    setActivePinia(createPinia());
    const wrapper = mount(RequestList, {
      props: {
        results: [
          {
            id: '1',
            timestamp: '2024-01-01T00:00:00Z',
            endpoint: '/api',
            method: 'GET',
            status: 'success',
            responseTime: 100,
            type: 'http',
            direction: 'request',
          },
        ],
        selectedResultId: '',
        isRead: () => false,
      },
    });
    await wrapper.find('.cursor-pointer').trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
  });
});
