import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';
import { defineComponent, nextTick } from 'vue';

import type { ActiveTab } from '@/stores/app/navigation/navigation.model';
import { useNavigationStore } from '@/stores/app/navigation/navigation.store';
import { useDlqStore } from '@/stores/dlq/dlq.store';
import { usePlaylistStore } from '@/stores/playlist/playlist.store';
import { usePopoutSettingsStore } from '@/stores/popout-settings/popout-settings.store';

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
  });

  it('shows the DLQ badge only away from the DLQ route', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    refs.activeTab.value = 'memory';
    useDlqStore().hasDlqActivity = true;
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
    const hidePopoutPreview = vi.spyOn(
      usePopoutSettingsStore(),
      'hidePopoutPreview',
    );
    const hidePlaylistPreview = vi.spyOn(
      usePlaylistStore(),
      'hidePlaylistPreview',
    );
    const wrapper = mount(Probe, { global: { plugins: [pinia] } });
    navigationStore.showChatStar = true;

    refs.activeTab.value = 'memory';
    await nextTick();
    expect(hidePopoutPreview).toHaveBeenCalledTimes(1);
    expect(hidePlaylistPreview).toHaveBeenCalledTimes(1);
    expect(navigationStore.showChatStar).toBe(true);

    refs.activeTab.value = 'chat';
    await nextTick();
    expect(hidePopoutPreview).toHaveBeenCalledTimes(2);
    expect(hidePlaylistPreview).toHaveBeenCalledTimes(2);
    expect(navigationStore.showChatStar).toBe(false);
    wrapper.unmount();
  });
});
