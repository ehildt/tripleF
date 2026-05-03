import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ExpandableMessageList from './ExpandableMessageList.vue';

const messages = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there! How can I help you today?' },
];

const bodySlot = '<div class="expandable-message-list__body">content</div>';

describe('ExpandableMessageList', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(ExpandableMessageList, { props: { items: [] } });
    expect(wrapper.find('.expandable-message-list').exists()).toBe(false);
  });

  it('renders nothing when items is null', () => {
    const wrapper = mount(ExpandableMessageList, { props: { items: null } });
    expect(wrapper.find('.expandable-message-list').exists()).toBe(false);
  });

  it('renders messages for a valid items array', () => {
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages },
    });
    expect(wrapper.findAll('.expandable-message-list__item')).toHaveLength(2);
  });

  it('expands content when clicking the chevron', async () => {
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages },
      slots: { body: bodySlot },
    });
    expect(wrapper.find('.expandable-message-list__body').exists()).toBe(false);

    await wrapper
      .find('.expandable-message-list__toggle-chevron')
      .trigger('click');
    expect(wrapper.find('.expandable-message-list__body').exists()).toBe(true);
  });

  it('renders all body slots expanded when expandAll is true', () => {
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages, expandAll: true },
      slots: { body: bodySlot },
    });
    expect(wrapper.findAll('.expandable-message-list__body')).toHaveLength(2);
  });

  it('does not toggle when clicking the role label, but fires onClick', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages, onClick },
      slots: { body: bodySlot },
    });
    expect(wrapper.find('.expandable-message-list__body').exists()).toBe(false);

    await wrapper
      .find('.expandable-message-list__toggle-role')
      .trigger('click');
    expect(wrapper.find('.expandable-message-list__body').exists()).toBe(false);
    expect(onClick).toHaveBeenCalledWith(0);
  });

  it('does not toggle when clicking the preview', async () => {
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages },
      slots: { body: bodySlot },
    });
    expect(wrapper.find('.expandable-message-list__body').exists()).toBe(false);

    await wrapper
      .find('.expandable-message-list__toggle-preview')
      .trigger('click');
    expect(wrapper.find('.expandable-message-list__body').exists()).toBe(false);
  });

  it('calls onClick when preview is clicked', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages, onClick },
      slots: { body: bodySlot },
    });

    await wrapper
      .find('.expandable-message-list__toggle-preview')
      .trigger('click');
    expect(onClick).toHaveBeenCalledWith(0);
  });

  it('does not call onClick when chevron is clicked', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages, onClick },
      slots: { body: bodySlot },
    });

    await wrapper
      .find('.expandable-message-list__toggle-chevron')
      .trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick when role label is clicked', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages, onClick },
    });

    await wrapper
      .find('.expandable-message-list__toggle-role')
      .trigger('click');
    expect(onClick).toHaveBeenCalledWith(0);
  });

  it('renders heading slot content', () => {
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages },
      slots: { heading: '<h4>Custom Heading</h4>' },
    });

    expect(wrapper.text()).toContain('Custom Heading');
  });

  it('renders expanded content with a 2000-character message', async () => {
    const longContent = 'x'.repeat(2000);
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages },
      slots: {
        body:
          '<div class="expandable-message-list__body">' +
          longContent +
          '</div>',
      },
    });

    await wrapper
      .find('.expandable-message-list__toggle-chevron')
      .trigger('click');
    expect(wrapper.find('.expandable-message-list__body').exists()).toBe(true);
    expect(wrapper.find('.expandable-message-list__body').text()).toHaveLength(
      2000,
    );
  });

  it('renders body slot content when expanded', async () => {
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages },
      slots: { body: '<div class="expandable-message-list__body">HELLO</div>' },
    });

    await wrapper
      .find('.expandable-message-list__toggle-chevron')
      .trigger('click');
    expect(wrapper.find('.expandable-message-list__body').text()).toContain(
      'HELLO',
    );
  });

  it('renders content in history mode without body slot', () => {
    const wrapper = mount(ExpandableMessageList, {
      props: { items: messages },
    });
    expect(wrapper.text()).toContain('Hello');
    expect(wrapper.text()).toContain('Hi there!');
    expect(
      wrapper.find('.expandable-message-list__toggle-chevron').exists(),
    ).toBe(false);
  });
});
