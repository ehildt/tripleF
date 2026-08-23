import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FieldGrid from './FieldGrid.vue';

/** A stub that renders with the `.field-card` class the grid counts on. */
const FieldCardStub = { template: '<div class="field-card" />' };

function mountGrid({
  itemsPerRow,
  prependItemsPerRow,
  prependCount = 0,
  defaultCount = 0,
}: {
  itemsPerRow: number;
  prependItemsPerRow: number;
  prependCount?: number;
  defaultCount?: number;
}) {
  const prepend = Array.from(
    { length: prependCount },
    () => '<FieldCard />',
  ).join('');
  const def = Array.from({ length: defaultCount }, () => '<FieldCard />').join(
    '',
  );
  return mount(FieldGrid, {
    props: { itemsPerRow, prependItemsPerRow },
    global: { stubs: { FieldCard: FieldCardStub } },
    slots: {
      prepend,
      default: def,
    },
  });
}

function rowColumns(wrapper: ReturnType<typeof mount>, index: number) {
  const rows = wrapper.findAll('.field-grid__row');
  const style = rows[index].attributes('style') ?? '';
  const match = style.match(/repeat\((\d+),/);
  return match ? Number(match[1]) : 0;
}

describe('FieldGrid', () => {
  it('renders both slots', () => {
    const wrapper = mountGrid({
      itemsPerRow: 2,
      prependItemsPerRow: 1,
      prependCount: 2,
      defaultCount: 3,
    });
    expect(wrapper.findAll('.field-grid__row')).toHaveLength(2);
    expect(wrapper.findAll('.field-card')).toHaveLength(5);
  });

  it('applies itemsPerRow to the default slot', () => {
    const wrapper = mountGrid({
      itemsPerRow: 4,
      prependItemsPerRow: 1,
      defaultCount: 8,
    });
    expect(rowColumns(wrapper, 1)).toBe(4);
  });

  it('applies prependItemsPerRow to the prepend slot', () => {
    const wrapper = mountGrid({
      itemsPerRow: 1,
      prependItemsPerRow: 2,
      prependCount: 3,
    });
    expect(rowColumns(wrapper, 0)).toBe(2);
  });

  it('omits the prepend row when the prepend slot is not provided', () => {
    const wrapper = mount(FieldGrid, {
      props: { itemsPerRow: 2, prependItemsPerRow: 2 },
      global: { stubs: { FieldCard: FieldCardStub } },
      slots: { default: '<FieldCard />' },
    });
    expect(wrapper.findAll('.field-grid__row')).toHaveLength(1);
  });
});
