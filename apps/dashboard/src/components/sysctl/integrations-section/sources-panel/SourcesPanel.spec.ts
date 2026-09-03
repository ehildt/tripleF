import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import SourcesPanel from './SourcesPanel.vue';

function mountPanel(sources = { preferred: ['bbc.com'], blocked: [] }) {
  return mount(SourcesPanel, { props: { sources } });
}

describe('SourcesPanel', () => {
  it('prefills the preferred and blocked textareas from the sources prop', () => {
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

  it('forwards a parsed preferred list as a patch with the preferred key', async () => {
    const wrapper = mountPanel();
    const preferred = wrapper.findAll('textarea')[0];
    // setValue dispatches input + change (v-model.lazy support) — the
    // textarea's change listener carries the save.
    await preferred.setValue('https://www.bbc.com/x\nNot A Host');
    expect(wrapper.emitted('patch')).toEqual([
      [{ key: 'preferred', value: ['bbc.com'] }],
    ]);
  });

  it('forwards a parsed blocked list as a patch with the blocked key', async () => {
    const wrapper = mountPanel();
    const blocked = wrapper.findAll('textarea')[1];
    await blocked.setValue('quora.com\npinterest.com');
    expect(wrapper.emitted('patch')).toEqual([
      [{ key: 'blocked', value: ['quora.com', 'pinterest.com'] }],
    ]);
  });

  it('forwards a reset for the preferred list', async () => {
    const wrapper = mountPanel();
    const preferredCard = wrapper.findAll('.source-list-card')[0];
    // ResetButton's root is a Tooltip — trigger the inner button directly.
    await preferredCard
      .findComponent(ResetButton)
      .find('button')
      .trigger('click');
    expect(wrapper.emitted('reset')).toEqual([['preferred']]);
  });

  it('emits 0 (no reference images) when the checkbox is toggled off', async () => {
    const wrapper = mountPanel({
      preferred: [],
      blocked: [],
      imageTaskReferenceCount: 6,
    });
    const checkbox = wrapper.find('button.field-card__checkbox');
    expect(checkbox.attributes('aria-pressed')).toBe('true');
    await checkbox.trigger('click');
    expect(wrapper.emitted('patch')).toContainEqual([
      { key: 'imageTaskReferenceCount', value: 0 },
    ]);
  });

  it('clamps the reference count to 1..50 on change', async () => {
    const wrapper = mountPanel({
      preferred: [],
      blocked: [],
      imageTaskReferenceCount: 6,
    });
    const numberField = wrapper.find('.input-number__field');
    await numberField.setValue('0');
    expect(wrapper.emitted('patch')).toContainEqual([
      { key: 'imageTaskReferenceCount', value: 1 },
    ]);
    await numberField.setValue('99');
    expect(wrapper.emitted('patch')).toContainEqual([
      { key: 'imageTaskReferenceCount', value: 50 },
    ]);
  });
});
