import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SourcesPanel from './SourcesPanel.vue';

function mountPanel(sources = { preferred: ['bbc.com'], blocked: [] }) {
  return mount(SourcesPanel, { props: { sources } });
}

describe('SourcesPanel', () => {
  it('prefills the textareas from the sources prop', () => {
    const wrapper = mountPanel({
      preferred: ['bbc.com', 'arstechnica.com'],
      blocked: ['pinterest.com'],
    });
    const [preferred, blocked] = wrapper.findAll('textarea');
    expect((preferred.element as HTMLTextAreaElement).value).toBe(
      'bbc.com\narstechnica.com',
    );
    expect((blocked.element as HTMLTextAreaElement).value).toBe(
      'pinterest.com',
    );
  });

  it('emits a parsed preferred list on change', async () => {
    const wrapper = mountPanel();
    const preferred = wrapper.findAll('textarea')[0];
    // setValue dispatches input + change (v-model.lazy support) — the
    // textarea's change listener carries the save.
    await preferred.setValue('https://www.bbc.com/x\nNot A Host');
    expect(wrapper.emitted('patch')).toEqual([
      [{ key: 'preferred', value: ['bbc.com'] }],
    ]);
  });

  it('emits a parsed blocked list on change', async () => {
    const wrapper = mountPanel();
    const blocked = wrapper.findAll('textarea')[1];
    await blocked.setValue('quora.com\npinterest.com');
    expect(wrapper.emitted('patch')).toEqual([
      [{ key: 'blocked', value: ['quora.com', 'pinterest.com'] }],
    ]);
  });

  it('syncs the drafts when the sources prop changes', async () => {
    const wrapper = mountPanel();
    await wrapper.setProps({
      sources: { preferred: ['reuters.com'], blocked: ['spam.example'] },
    });
    const [preferred, blocked] = wrapper.findAll('textarea');
    expect((preferred.element as HTMLTextAreaElement).value).toBe(
      'reuters.com',
    );
    expect((blocked.element as HTMLTextAreaElement).value).toBe('spam.example');
  });
});
