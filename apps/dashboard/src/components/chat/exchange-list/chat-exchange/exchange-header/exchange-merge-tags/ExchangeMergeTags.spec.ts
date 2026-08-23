import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ExchangeMergeTags from './ExchangeMergeTags.vue';

function mountTags(requestIds: string[]) {
  return mount(ExchangeMergeTags, { props: { requestIds } });
}

describe('ExchangeMergeTags', () => {
  it('renders one tag per request id', () => {
    const wrapper = mountTags(['req-1', 'req-2']);

    const tags = wrapper.findAll('.merge-tags__tag');
    expect(tags).toHaveLength(2);
    expect(tags[0].text()).toBe('req-1');
    expect(tags[1].text()).toBe('req-2');
  });

  it('renders nothing without request ids', () => {
    const wrapper = mountTags([]);
    expect(wrapper.find('.merge-tags').exists()).toBe(false);
  });
});
