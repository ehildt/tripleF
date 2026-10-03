import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { HistoryListItemData } from './HistoryList.types';
import HistoryList from './HistoryList.vue';

const items: HistoryListItemData[] = [
  {
    id: 'u1',
    role: 'user',
    content: 'First prompt',
    included: true,
    mergeSelected: false,
    merged: false,
    contextPercent: '12.50',
  },
  {
    id: 'u2',
    role: 'user',
    content: 'Second prompt',
    included: false,
    mergeSelected: true,
    merged: false,
    mergedRequestId: undefined,
  },
];

function mountList(overrides: Record<string, unknown> = {}) {
  return mount(HistoryList, {
    props: { items, ...overrides },
  });
}

describe('HistoryList', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(HistoryList, { props: { items: [] } });
    expect(wrapper.find('.history-list').exists()).toBe(false);
  });

  it('renders a row per item', () => {
    const wrapper = mountList();
    expect(wrapper.findAll('.history-list-item')).toHaveLength(2);
  });

  it('emits select with the row index when a row is clicked', async () => {
    const wrapper = mountList();
    await wrapper.findAll('.history-list-item')[0].trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual([0]);
  });

  it.each([
    ['Copy', 'copy'],
    ['Branch into a new chat', 'branchOut'],
    ['Delete from history', 'deleteItem'],
  ])(
    'emits %s with the row index when its button is clicked',
    async (ariaLabel, event) => {
      const wrapper = mountList();
      await wrapper.find(`[aria-label="${ariaLabel}"]`).trigger('click');
      expect(wrapper.emitted(event)?.[0]).toEqual([0]);
    },
  );

  it('marks the excluded row and emits toggleInclude with the row index', async () => {
    const wrapper = mountList();
    expect(wrapper.find('.history-list-item__include--excluded').exists()).toBe(
      true,
    );

    await wrapper.findAll('.history-list-item__include')[0].trigger('click');
    expect(wrapper.emitted('toggleInclude')?.[0]).toEqual([0]);
  });

  it('disables merge buttons when canMerge is false', () => {
    const wrapper = mountList({ canMerge: false });
    const mergeButtons = wrapper.findAll('.history-list-item__merge');
    expect(mergeButtons.length).toBeGreaterThan(0);
    for (const button of mergeButtons) {
      expect(button.attributes('disabled')).toBeDefined();
    }
  });

  it('emits toggleMerge with the row index when merge is enabled', async () => {
    const wrapper = mountList({ canMerge: true });
    await wrapper.findAll('.history-list-item__merge')[0].trigger('click');
    expect(wrapper.emitted('toggleMerge')?.[0]).toEqual([0]);
  });

  it('applies the selected and pulse classes to an armed merge selection', () => {
    const wrapper = mountList({ canMerge: true, mergeArmed: true });
    expect(wrapper.find('.history-list-item__merge--selected').exists()).toBe(
      true,
    );
    expect(wrapper.find('.history-list-item__merge--pulse').exists()).toBe(
      true,
    );
  });

  it('marks rows consumed by a completed merge', () => {
    const wrapper = mountList({
      items: [
        {
          id: 'u1',
          role: 'user',
          content: 'Merged prompt',
          included: true,
          mergeSelected: false,
          merged: true,
          mergedRequestId: 'r1',
        },
      ],
      canMerge: true,
    });
    expect(wrapper.find('.history-list-item--merged').exists()).toBe(true);
    expect(wrapper.find('.history-list-item__merge--consumed').exists()).toBe(
      true,
    );
  });

  it('hides actions per iconVisibility while keeping the merge button', () => {
    const wrapper = mountList({
      iconVisibility: {
        copy: false,
        include: false,
        branch: false,
        delete: false,
      },
    });
    expect(wrapper.find('[aria-label="Copy"]').exists()).toBe(false);
    expect(wrapper.find('.history-list-item__include').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Branch into a new chat"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[aria-label="Delete from history"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('.history-list-item__merge').exists()).toBe(true);
  });

  it('renders the active marquee and the context-percent badge', () => {
    const wrapper = mountList({ activeId: 'u1' });
    expect(wrapper.find('.history-list-item__marquee').exists()).toBe(true);
    expect(wrapper.find('.history-list-item__percent').text()).toBe('12.50%');
  });
});
