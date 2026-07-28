import { describe, expect, it } from 'vitest';
import { nextTick, type Ref, ref } from 'vue';

import { useMenuPosition } from './use-menu-position';

function fakeTrigger(rect: Partial<DOMRect>): Ref<HTMLElement> {
  return ref({
    getBoundingClientRect: () => rect as DOMRect,
  } as HTMLElement);
}

async function openMenu(isOpen: Ref<boolean>) {
  isOpen.value = true;
  await nextTick();
}

describe('useMenuPosition', () => {
  it('has no position before the menu opens', () => {
    const isOpen = ref(false);
    const trigger = fakeTrigger({ right: 204, top: 40 });

    const { positionStyle } = useMenuPosition(trigger, isOpen);

    expect(positionStyle.value).toBeNull();
  });

  it('anchors the menu to the trigger rect once open', async () => {
    const isOpen = ref(false);
    const trigger = fakeTrigger({ right: 204, top: 40 });

    const { positionStyle } = useMenuPosition(trigger, isOpen);
    await openMenu(isOpen);

    expect(positionStyle.value).toEqual({ left: '204px', top: '40px' });
  });

  it('has no position when the trigger is missing', async () => {
    const isOpen = ref(false);
    const { positionStyle } = useMenuPosition(ref(null), isOpen);
    await openMenu(isOpen);

    expect(positionStyle.value).toBeNull();
  });

  it('re-anchors on scroll and resize while open', async () => {
    const isOpen = ref(false);
    let rect = { right: 10, top: 10 } as DOMRect;
    const trigger = ref({
      getBoundingClientRect: () => rect,
    } as HTMLElement);

    const { positionStyle } = useMenuPosition(trigger, isOpen);
    await openMenu(isOpen);

    rect = { right: 55, top: 66 } as DOMRect;
    window.dispatchEvent(new Event('scroll'));
    expect(positionStyle.value).toEqual({ left: '55px', top: '66px' });

    rect = { right: 77, top: 88 } as DOMRect;
    window.dispatchEvent(new Event('resize'));
    expect(positionStyle.value).toEqual({ left: '77px', top: '88px' });
  });

  it('stops tracking after the menu closes', async () => {
    const isOpen = ref(false);
    let rect = { right: 10, top: 10 } as DOMRect;
    const trigger = ref({
      getBoundingClientRect: () => rect,
    } as HTMLElement);

    const { positionStyle } = useMenuPosition(trigger, isOpen);
    await openMenu(isOpen);

    isOpen.value = false;
    await nextTick();

    rect = { right: 999, top: 999 } as DOMRect;
    window.dispatchEvent(new Event('scroll'));

    expect(positionStyle.value).toEqual({ left: '10px', top: '10px' });
  });
});
