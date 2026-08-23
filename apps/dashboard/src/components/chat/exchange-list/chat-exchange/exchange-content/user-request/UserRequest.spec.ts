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
    expect(wrapper.find('script').exists()).toBe(false);
    // Raw tags are escaped and stay as text inside the markdown paragraph
    // wrapper — only that one <p> exists.
    expect(wrapper.findAll('p')).toHaveLength(1);
    expect(wrapper.find('p').text()).toBe(
      '<p>Hello</p><script>alert("xss")</script>',
    );
  });

  it('preserves line breaks in the content', () => {
    const wrapper = mountUserRequest({ content: 'Line one\nLine two' });
    expect(wrapper.find('br').exists()).toBe(true);
    expect(wrapper.text()).toContain('Line one');
    expect(wrapper.text()).toContain('Line two');
  });

  it('renders markdown formatting', () => {
    const wrapper = mountUserRequest({
      content: '**bold** and [link](https://example.com)',
    });
    expect(wrapper.find('strong').text()).toBe('bold');
    expect(wrapper.find('a').attributes('href')).toBe('https://example.com');
  });

  it('renders inline code from backticks', () => {
    const wrapper = mountUserRequest({
      content: 'Run `npm run dev` to start.',
    });
    const code = wrapper.find('code');
    expect(code.exists()).toBe(true);
    expect(code.text()).toBe('npm run dev');
  });
});
