import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DetailTag from './DetailTag.vue';

describe('DetailTag', () => {
  it('renders formatted label and value', () => {
    const wrapper = mount(DetailTag, {
      props: {
        field: 'requestId',
        value: 'req-123',
      },
    });
    expect(wrapper.text()).toContain('Request ID');
    expect(wrapper.text()).toContain('req-123');
  });

  it('does not render when value is empty string', () => {
    const wrapper = mount(DetailTag, {
      props: {
        field: 'requestId',
        value: '',
      },
    });
    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('does not render when value is null', () => {
    const wrapper = mount(DetailTag, {
      props: {
        field: 'requestId',
        value: null,
      },
    });
    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('does not render when value is undefined', () => {
    const wrapper = mount(DetailTag, {
      props: {
        field: 'requestId',
        value: undefined,
      },
    });
    expect(wrapper.find('div').exists()).toBe(false);
  });

  it('formats special field names', () => {
    const wrapper = mount(DetailTag, {
      props: {
        field: 'statusCode',
        value: 200,
      },
    });
    expect(wrapper.text()).toContain('Status');
    expect(wrapper.text()).toContain('200');
  });
});
