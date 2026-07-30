import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ResizeHandleGrid, { type ResizeDirection } from './ResizeHandleGrid.vue';

describe('ResizeHandleGrid', () => {
  it('renders all eight handles by default', () => {
    const wrapper = mount(ResizeHandleGrid);
    expect(wrapper.findAll('.resize-handle-grid__handle')).toHaveLength(8);
  });

  it('limits handles to the provided directions', () => {
    const wrapper = mount(ResizeHandleGrid, {
      props: { directions: ['se', 'sw'] as ResizeDirection[] },
    });
    const handles = wrapper.findAll('.resize-handle-grid__handle');
    expect(handles).toHaveLength(2);
    expect(handles[0].classes()).toContain('resize-handle-grid__handle--se');
    expect(handles[1].classes()).toContain('resize-handle-grid__handle--sw');
  });

  it('emits resize with direction and pointer event on pointerdown', async () => {
    const wrapper = mount(ResizeHandleGrid);
    const handle = wrapper.find('.resize-handle-grid__handle--n');
    await handle.trigger('pointerdown');
    expect(wrapper.emitted('resize')).toBeTruthy();
    const event = wrapper.emitted('resize')![0];
    expect(event[0]).toBe('n');
    expect(event[1]).toBeInstanceOf(PointerEvent);
  });
});
