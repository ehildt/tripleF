import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import UserRequest from './UserRequest.vue';

function mountUserRequest(props: { content: string }) {
  return mount(UserRequest, {
    props,
  });
}

describe('UserRequest', () => {
  it('renders plain text content', () => {
    const wrapper = mountUserRequest({ content: 'Hello assistant' });
    expect(wrapper.text()).toBe('Hello assistant');
  });

  it('escapes HTML-like content instead of rendering it', () => {
    const wrapper = mountUserRequest({
      content: '<p>Hello</p><script>alert("xss")</script>',
    });
    expect(wrapper.find('p').exists()).toBe(false);
    expect(wrapper.find('script').exists()).toBe(false);
    expect(wrapper.text()).toContain('<p>Hello</p>');
  });

  it('preserves line breaks in the content', () => {
    const wrapper = mountUserRequest({ content: 'Line one\nLine two' });
    expect(wrapper.text()).toContain('Line one');
    expect(wrapper.text()).toContain('Line two');
  });
});
