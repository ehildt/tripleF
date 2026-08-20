import { ThumbsUp } from '@lucide/vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import SourceListCard from './SourceListCard.vue';

function mountCard(list: readonly string[] = []) {
  return mount(SourceListCard, {
    props: {
      list,
      icon: ThumbsUp,
      label: 'Preferred sources',
      description: 'Hint text',
      resetTitle: 'Reset',
      placeholder: 'bbc.com\narstechnica.com',
    },
  });
}

describe('SourceListCard', () => {
  it('prefills the textarea from the list prop', () => {
    const wrapper = mountCard(['bbc.com', 'arstechnica.com']);
    const textarea = wrapper.find('textarea');
    expect((textarea.element as HTMLTextAreaElement).value).toBe(
      'bbc.com\narstechnica.com',
    );
  });

  it('emits a parsed list on change', async () => {
    const wrapper = mountCard();
    // setValue dispatches input + change (v-model.lazy support) — the
    // textarea's change listener carries the save.
    await wrapper
      .find('textarea')
      .setValue('https://www.bbc.com/x\nNot A Host');
    expect(wrapper.emitted('change')).toEqual([[['bbc.com']]]);
  });

  it('syncs the draft when the list prop changes', async () => {
    const wrapper = mountCard();
    await wrapper.setProps({ list: ['reuters.com', 'spam.example'] });
    const textarea = wrapper.find('textarea');
    expect((textarea.element as HTMLTextAreaElement).value).toBe(
      'reuters.com\nspam.example',
    );
  });

  it('emits reset from the header button', async () => {
    const wrapper = mountCard(['bbc.com']);
    // ResetButton's root is a Tooltip — trigger the inner button directly.
    await wrapper.findComponent(ResetButton).find('button').trigger('click');
    expect(wrapper.emitted('reset')).toHaveLength(1);
  });
});
