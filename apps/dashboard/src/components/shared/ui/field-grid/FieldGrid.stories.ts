import type { Meta, StoryObj } from '@storybook/vue3-vite';

import NumberFieldCard from '../number-field-card/NumberFieldCard.vue';
import FieldGrid from './FieldGrid.vue';

const meta = {
  title: 'Shared/FieldGrid',
  component: FieldGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof FieldGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

function makeCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    label: `Field ${i + 1}`,
    description: 'A configurable field',
  }));
}

/** A single default-slot row (no prepend). */
export const SingleRow: Story = {
  render: () => ({
    components: { FieldGrid, NumberFieldCard },
    setup: () => ({ cards: makeCards(8) }),
    template: `
      <FieldGrid :items-per-row="4">
        <NumberFieldCard v-for="c in cards" :key="c.label" :label="c.label" :description="c.description" />
      </FieldGrid>
    `,
  }),
};

/** Two slots, each with its own items-per-row. */
export const TwoSlots: Story = {
  render: () => ({
    components: { FieldGrid, NumberFieldCard },
    setup: () => ({ prepend: makeCards(3), cards: makeCards(8) }),
    template: `
      <FieldGrid :items-per-row="4" :prepend-items-per-row="3">
        <template #prepend>
          <NumberFieldCard v-for="c in prepend" :key="c.label" :label="c.label" :description="c.description" />
        </template>
        <NumberFieldCard v-for="c in cards" :key="c.label" :label="c.label" :description="c.description" />
      </FieldGrid>
    `,
  }),
};
