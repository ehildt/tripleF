import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConversationHeaderActions from './ConversationHeaderActions.vue';

describe('ConversationHeaderActions', () => {
  function mountComponent(props: {
    conversationType?: 'temporary' | 'persistent';
    compacting?: boolean;
  }) {
    return mount(ConversationHeaderActions, {
      props: {
        conversationType: 'temporary',
        compacting: false,
        ...props,
      },
    });
  }

  it('renders four action buttons', () => {
    const wrapper = mountComponent({});
    expect(wrapper.findAll('button')).toHaveLength(4);
  });

  it('emits rename when rename button clicked', async () => {
    const wrapper = mountComponent({});
    await wrapper.find('[title="Rename"]').trigger('click');
    expect(wrapper.emitted('rename')).toBeTruthy();
  });

  it('emits delete when delete button clicked', async () => {
    const wrapper = mountComponent({});
    await wrapper.find('[title="Delete conversation"]').trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('emits toggleType when pin button clicked', async () => {
    const wrapper = mountComponent({});
    await wrapper.find('[title="Pin to persistent"]').trigger('click');
    expect(wrapper.emitted('toggleType')).toBeTruthy();
  });

  it('emits compact when compact button clicked', async () => {
    const wrapper = mountComponent({});
    await wrapper.find('[title="Compact"]').trigger('click');
    expect(wrapper.emitted('compact')).toBeTruthy();
  });

  it('disables compact button while compacting', () => {
    const wrapper = mountComponent({ compacting: true });
    const compactButton = wrapper.find('[title="Compacting..."]');
    expect(compactButton.attributes('disabled')).toBeDefined();
  });
});
