import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ConversationTitleEditor from './ConversationTitleEditor.vue';

describe('ConversationTitleEditor', () => {
  it('renders the model value', () => {
    const wrapper = mount(ConversationTitleEditor, {
      props: { modelValue: 'Test title' },
    });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      'Test title',
    );
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(ConversationTitleEditor, {
      props: { modelValue: '' },
    });
    await wrapper.find('input').setValue('Updated');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['Updated']);
  });

  it('emits keydown on key events', async () => {
    const wrapper = mount(ConversationTitleEditor, {
      props: { modelValue: '' },
    });
    await wrapper.find('input').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('keydown')).toBeTruthy();
  });

  it('emits blur on blur', async () => {
    const wrapper = mount(ConversationTitleEditor, {
      props: { modelValue: '' },
    });
    await wrapper.find('input').trigger('blur');
    expect(wrapper.emitted('blur')).toBeTruthy();
  });
});
