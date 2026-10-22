import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Pagination from './Pagination.vue';

function mountPagination(props: {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  offset: number;
}) {
  return mount(Pagination, { props });
}

describe('Pagination', () => {
  it('renders every page directly when 5 or fewer', () => {
    const wrapper = mountPagination({
      currentPage: 1,
      totalPages: 3,
      total: 25,
      limit: 10,
      offset: 0,
    });

    const pages = wrapper.findAll('.pagination__pages .pagination__page');
    expect(pages).toHaveLength(3);
    expect(wrapper.find('.pagination__ellipsis').exists()).toBe(false);
  });

  it('renders the boundary pages with an ellipsis for long ranges', () => {
    const wrapper = mountPagination({
      currentPage: 1,
      totalPages: 12,
      total: 120,
      limit: 10,
      offset: 0,
    });

    const pages = wrapper.findAll('.pagination__pages .pagination__page');
    expect(pages.map((p) => p.text())).toEqual(['1', '2', '3', '4', '12']);
    expect(wrapper.find('.pagination__ellipsis').exists()).toBe(true);
  });

  it('disables prev/first on the first page and next/last on the last', () => {
    const first = mountPagination({
      currentPage: 1,
      totalPages: 3,
      total: 25,
      limit: 10,
      offset: 0,
    });
    const buttons = first.findAll('.pagination__pages button');
    expect(buttons[0].attributes('disabled')).toBeDefined();
    expect(buttons[1].attributes('disabled')).toBeDefined();

    const last = mountPagination({
      currentPage: 3,
      totalPages: 3,
      total: 25,
      limit: 10,
      offset: 20,
    });
    const lastButtons = last.findAll('.pagination__pages button');
    expect(
      lastButtons[lastButtons.length - 2].attributes('disabled'),
    ).toBeDefined();
    expect(
      lastButtons[lastButtons.length - 1].attributes('disabled'),
    ).toBeDefined();
  });

  it('emits navigation and page-size events', async () => {
    const wrapper = mountPagination({
      currentPage: 2,
      totalPages: 3,
      total: 25,
      limit: 10,
      offset: 10,
    });

    const nav = wrapper.findAll('.pagination__pages button');
    await nav[0].trigger('click'); // first
    await nav[1].trigger('click'); // prev
    expect(wrapper.emitted('first')).toHaveLength(1);
    expect(wrapper.emitted('prev')).toHaveLength(1);

    await wrapper
      .findAll('.pagination__pages .pagination__page')[0]
      .trigger('click');
    expect(wrapper.emitted('page')).toEqual([[1]]);

    const sizeButtons = wrapper.findAll('.pagination__sizes button');
    if (sizeButtons.length) {
      await sizeButtons[sizeButtons.length - 1].trigger('click');
      expect(wrapper.emitted('setPageSize')?.length).toBeGreaterThan(0);
    }
  });
});
