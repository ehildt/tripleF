import { computed } from 'vue';

import { useToastSettingsStore } from '@/stores/widgets/toast-settings/toast-settings.store';

/**
 * The toast stack's screen anchor, split into its vertical ('top' |
 * 'middle' | 'bottom') and horizontal ('left' | 'center' | 'right')
 * components for the container's BEM modifiers. The anchor itself is a
 * user setting (Settings → Widgets → Toast notifications) read from the
 * toast settings store.
 */
export function useToastAnchor() {
  const toastSettingsStore = useToastSettingsStore();

  const anchorVertical = computed(
    () => toastSettingsStore.toastAnchor.split('-')[0],
  );
  const anchorHorizontal = computed(
    () => toastSettingsStore.toastAnchor.split('-')[1],
  );

  return { anchorVertical, anchorHorizontal };
}
