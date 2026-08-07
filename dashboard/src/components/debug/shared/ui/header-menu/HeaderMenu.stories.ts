import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import HeaderMenu from './HeaderMenu.vue';

const meta = {
  title: 'Debug/Shared/UI/HeaderMenu/HeaderMenu',
  component: HeaderMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The action row of the request-log header. Holds the type filter
(ALL / HTTP / SOCKET), the hide-read toggle, the pause/resume switch,
and the clear button.
`,
      },
    },
  },
  argTypes: {
    filter: {
      control: { type: 'select' },
      options: ['all', 'http', 'socket'],
    },
    allCount: { control: 'number' },
    httpCount: { control: 'number' },
    socketCount: { control: 'number' },
    hideRead: { control: 'boolean' },
  },
  args: {
    filter: 'all',
    search: '',
    allCount: 12,
    httpCount: 8,
    socketCount: 4,
    hideRead: false,
    onClear: fn(),
    'onUpdate:filter': fn(),
    'onUpdate:search': fn(),
    'onUpdate:hideRead': fn(),
  },
} satisfies Meta<typeof HeaderMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — all counts non-zero, no filters active. */
export const Default: Story = {};

/** HTTP filter active. */
export const HttpFilter: Story = { args: { filter: 'http' } };

/** Socket filter active. */
export const SocketFilter: Story = { args: { filter: 'socket' } };

/** Hide-read enabled. */
export const HideRead: Story = { args: { hideRead: true } };

/** Zero results — all buttons disabled. */
export const Empty: Story = {
  args: { allCount: 0, httpCount: 0, socketCount: 0 },
};
