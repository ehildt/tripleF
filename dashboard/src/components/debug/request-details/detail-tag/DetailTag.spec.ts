import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/colors/detail-field/get-detail-field-colors.helper', () => ({
  getDetailFieldColors: () => ({
    border: 'border-blue-500',
    text: 'text-blue-500',
    gradient: 'from-blue-500/20',
  }),
}));

vi.mock('@/utils/colors/detail-field/get-value-type-color.helper', () => ({
  getValueTypeColor: () => 'text-green-500',
}));

vi.mock('@/utils/colors/detail-field/get-value-type-gradient.helper', () => ({
  getValueTypeGradient: () => 'from-green-500/20',
}));

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
