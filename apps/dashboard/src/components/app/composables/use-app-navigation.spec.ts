import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';
import { defineComponent, nextTick } from 'vue';

import { useDlqActivity } from '@/components/dlq/composables/use-dlq-activity';
import { useWidgetPreview } from '@/components/widgets/shared/composables/use-widget-preview';
import type { ActiveTab } from '@/stores/app/navigation/navigation.model';
import { useNavigationStore } from '@/stores/app/navigation/navigation.store';

import { useAppNavigation } from './use-app-navigation';

const refs = vi.hoisted(() => ({})) as { activeTab: Ref<ActiveTab> };

vi.mock('./use-active-tab', async () => {
  const { ref } = await import('vue');
  refs.activeTab = ref<ActiveTab>('chat');
  return { useActiveTab: () => ({ activeTab: refs.activeTab }) };
});

const Probe = defineComponent({
  setup() {
    return useAppNavigation();
  },
  template: '<div />',
});

describe('useAppNavigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    refs.activeTab.value = 'chat';
    useDlqActivity().clearDlqActivity();
    useWidgetPreview().hideWidgetPreview();
  });

  it('shows the DLQ badge only away from the DLQ route', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    refs.activeTab.value = 'memory';
    useDlqActivity().markDlqActivity();
    const wrapper = mount(Probe, { global: { plugins: [pinia] } });
    expect(wrapper.vm.showDlqBadge).toBe(true);

    refs.activeTab.value = 'dlq';
    await nextTick();
    expect(wrapper.vm.showDlqBadge).toBe(false);
    wrapper.unmount();
  });

  it('dismisses previews on navigation and clears chat activity on Chat', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const navigationStore = useNavigationStore();
    const widgetPreview = useWidgetPreview();
    widgetPreview.toggleWidgetPreview('playlist');
    const wrapper = mount(Probe, { global: { plugins: [pinia] } });
    navigationStore.showChatStar = true;

    refs.activeTab.value = 'memory';
    await nextTick();
    expect(widgetPreview.activeWidgetPreview.value).toBeNull();
    expect(navigationStore.showChatStar).toBe(true);

    widgetPreview.toggleWidgetPreview('popout');
    refs.activeTab.value = 'chat';
    await nextTick();
    expect(widgetPreview.activeWidgetPreview.value).toBeNull();
    expect(navigationStore.showChatStar).toBe(false);
    wrapper.unmount();
  });
});
