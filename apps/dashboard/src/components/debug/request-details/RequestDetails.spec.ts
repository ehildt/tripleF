import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RequestDetails from './RequestDetails.vue';

describe('RequestDetails', () => {
  it('renders empty state when no result', () => {
    const wrapper = mount(RequestDetails, {
      props: { result: null },
    });
    expect(wrapper.find('.panel-empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain("You're all set");
  });

  it('renders property rows and tab menu', () => {
    const wrapper = mount(RequestDetails, {
      props: {
        result: {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          endpoint: '/api/v1/harness?key=val',
          method: 'POST',
          status: 'success',
          responseTime: 42,
          type: 'http',
          direction: 'request',
          requestHeaders: { 'x-harness-llm': 'llama' },
          requestBody: '{"prompt":"Describe this"}',
          responseBody: '{"ok":true}',
        },
      },
    });
    expect(wrapper.text()).toContain('/api/v1/harness');
    expect(wrapper.text()).toContain('42ms');
    expect(wrapper.text()).toContain('Params');
    expect(wrapper.text()).toContain('Headers');
    expect(wrapper.text()).toContain('Body');
    expect(wrapper.text()).toContain('Response');
  });

  it('shows tab content when clicked', async () => {
    const wrapper = mount(RequestDetails, {
      props: {
        result: {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          endpoint: '/api/v1/harness?foo=bar',
          method: 'GET',
          status: 'success',
          responseTime: 0,
          type: 'http',
          direction: 'request',
        },
      },
    });
    expect(wrapper.text()).toContain('Params');
    expect(wrapper.text()).toContain('"foo"');
    expect(wrapper.text()).toContain('"bar"');
  });

  it('does not render the tab panel when there are no tabs', () => {
    const wrapper = mount(RequestDetails, {
      props: {
        result: {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          endpoint: '/api/v1/harness',
          method: 'GET',
          status: 'success',
          responseTime: 0,
          type: 'http',
          direction: 'request',
        },
      },
    });
    expect(wrapper.find('.tab-panel').exists()).toBe(false);
  });
});
