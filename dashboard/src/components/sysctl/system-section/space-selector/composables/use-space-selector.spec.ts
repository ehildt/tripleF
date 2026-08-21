import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';

import { useSpaceSelector } from './use-space-selector';

/** ResizeObserver is used by useMenuPosition once the menu opens. */
class FakeResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const originalResizeObserver = globalThis.ResizeObserver;
globalThis.ResizeObserver =
  FakeResizeObserver as unknown as typeof ResizeObserver;

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

function mountSelector(initialSpaces: string[] = []) {
  const spaces = ref(initialSpaces);
  const containerRef = ref<HTMLElement | null>(null);
  const triggerRef = ref<HTMLElement | null>(null);
  const dropdownRef = ref<HTMLElement | null>(null);
  let composable!: ReturnType<typeof useSpaceSelector>;

  const Host = defineComponent({
    setup() {
      composable = useSpaceSelector(spaces, {
        containerRef,
        triggerRef,
        dropdownRef,
      });
      return () => null;
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { spaces, composable, containerRef, wrapper };
}

describe('useSpaceSelector', () => {
  it('starts closed with an empty search query', () => {
    const { composable, wrapper } = mountSelector(['alice']);
    expect(composable.isOpen.value).toBe(false);
    expect(composable.searchQuery.value).toBe('');
    wrapper.unmount();
  });

  it('toggleMenu opens the dropdown and clears the previous query', async () => {
    const { composable, wrapper } = mountSelector(['alice', 'work']);
    composable.searchQuery.value = 'alice';
    composable.toggleMenu();
    await nextTick();
    expect(composable.isOpen.value).toBe(true);
    expect(composable.searchQuery.value).toBe('');

    composable.toggleMenu();
    expect(composable.isOpen.value).toBe(false);
    wrapper.unmount();
  });

  it('filters spaces by the query (case-insensitive substring)', async () => {
    const { composable, wrapper } = mountSelector([
      'alice',
      'research-assistant',
      'work',
    ]);
    composable.toggleMenu();
    await nextTick();
    composable.searchQuery.value = 'ALI';
    expect(composable.filteredSpaces.value).toEqual(['alice']);
    composable.searchQuery.value = 'assistant';
    expect(composable.filteredSpaces.value).toEqual(['research-assistant']);
    wrapper.unmount();
  });

  it('reacts to history changes while open', async () => {
    const { spaces, composable, wrapper } = mountSelector(['alice']);
    composable.toggleMenu();
    await nextTick();
    spaces.value = ['alice', 'work'];
    expect(composable.filteredSpaces.value).toEqual(['alice', 'work']);
    spaces.value = [];
    expect(composable.filteredSpaces.value).toEqual([]);
    wrapper.unmount();
  });

  it('exposes a creatable space only for queries no space matches exactly', () => {
    const { composable, wrapper } = mountSelector(['alice', 'Work']);
    composable.searchQuery.value = 'bob';
    expect(composable.creatableSpace.value).toBe('bob');
    composable.searchQuery.value = 'alice';
    expect(composable.creatableSpace.value).toBeNull();
    // Exact match is case-insensitive.
    composable.searchQuery.value = 'work';
    expect(composable.creatableSpace.value).toBeNull();
    // Blank queries are never creatable.
    composable.searchQuery.value = '   ';
    expect(composable.creatableSpace.value).toBeNull();
    wrapper.unmount();
  });

  it('trims the creatable space id', () => {
    const { composable, wrapper } = mountSelector([]);
    composable.searchQuery.value = '  bob  ';
    expect(composable.creatableSpace.value).toBe('bob');
    wrapper.unmount();
  });

  it('closes on mousedown outside the container and dropdown', async () => {
    const { composable, wrapper } = mountSelector(['alice']);
    composable.toggleMenu();
    await nextTick();
    expect(composable.isOpen.value).toBe(true);

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(composable.isOpen.value).toBe(false);
    wrapper.unmount();
  });

  it('stays open on mousedown inside the container', async () => {
    const { composable, containerRef, wrapper } = mountSelector(['alice']);
    composable.toggleMenu();
    await nextTick();

    const inside = document.createElement('div');
    containerRef.value = inside;
    document.body.appendChild(inside);
    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(composable.isOpen.value).toBe(true);
    inside.remove();
    wrapper.unmount();
  });
});
