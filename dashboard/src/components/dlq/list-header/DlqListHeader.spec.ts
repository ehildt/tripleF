import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DlqListHeader from './DlqListHeader.vue';

const baseProps = {
  showLoading: false,
  filterStatus: '',
  filterQueue: '',
  filterSearch: '',
  hideRead: false,
  total: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 20,
  offset: 0,
};

describe('DlqListHeader', () => {
  it('renders the Jobs title', () => {
    const wrapper = mount(DlqListHeader, { props: baseProps });
    expect(wrapper.text()).toContain('Jobs');
  });

  it('emits reload when the reload button is clicked', async () => {
    const wrapper = mount(DlqListHeader, { props: baseProps });
    const buttons = wrapper.findAll('button');
    // The hide-read button is the last one, the reload button is second-to-last
    // when the page is non-empty
    const reloadButton = buttons[buttons.length - 2];
    await reloadButton.trigger('click');
    expect(wrapper.emitted('reload')).toBeTruthy();
  });

  it('emits update:hideRead when the hide-read toggle is clicked', async () => {
    const wrapper = mount(DlqListHeader, { props: baseProps });
    const buttons = wrapper.findAll('button');
    const hideReadButton = buttons[buttons.length - 1];
    await hideReadButton.trigger('click');
    expect(wrapper.emitted('update:hideRead')).toBeTruthy();
  });

  it('shows pagination only when total > 0', () => {
    const noPagination = mount(DlqListHeader, {
      props: { ...baseProps, total: 0 },
    });
    expect(noPagination.find('[class*="pagination"]').exists()).toBe(false);

    const withPagination = mount(DlqListHeader, {
      props: { ...baseProps, total: 25, totalPages: 2 },
    });
    expect(withPagination.find('[class*="pagination"]').exists()).toBe(true);
  });
});
