import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import DlqListHeader from './DlqListHeader.vue';

const meta = {
  title: 'Dlq/ListHeader/DlqListHeader',
  component: DlqListHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The header of the DLQ list: title, two filter menus (status, search),
a reload button, a hide-read toggle, and the pagination row.
`,
      },
    },
  },
  args: {
    showLoading: false,
    filterStatus: '',
    filterSearch: '',
    hideRead: false,
    total: 25,
    currentPage: 1,
    totalPages: 2,
    limit: 20,
    offset: 0,
    onReload: fn(),
    'onUpdate:filterStatus': fn(),
    'onUpdate:filterSearch': fn(),
    'onUpdate:hideRead': fn(),
    onFirstPage: fn(),
    onPrevPage: fn(),
    onNextPage: fn(),
    onLastPage: fn(),
    onSetPage: fn(),
    onSetPageSize: fn(),
  },
} satisfies Meta<typeof DlqListHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — no active filters, pagination visible. */
export const Default: Story = {};

/** All filters active. */
export const FiltersActive: Story = {
  args: {
    filterStatus: 'Failed',
    filterSearch: 'req-',
    hideRead: true,
  },
};

/** Loading — reload button shows the pending indicator. */
export const Loading: Story = { args: { showLoading: true } };

/** Empty DLQ — no pagination. */
export const Empty: Story = { args: { total: 0, totalPages: 1 } };
