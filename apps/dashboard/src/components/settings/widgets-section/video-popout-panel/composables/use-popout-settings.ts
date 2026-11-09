import { usePlaybackSession } from '@/composables/use-playback-session/use-playback-session';
import { usePopoutSettingsStore } from '@/stores/widgets/popout-settings/popout-settings.store';
import type { PopoutAnchor } from '@/stores/widgets/popout-settings/popout-settings.types';

import type { PopoutSettingsControls } from './use-popout-settings.types';

/** Compose popout preferences with their dependent live geometry state. */
export function usePopoutSettings(): PopoutSettingsControls {
  const settingsStore = usePopoutSettingsStore();
  const playback = usePlaybackSession();

  function setPopoutAnchor(anchor: PopoutAnchor): void {
    settingsStore.setPopoutAnchor(anchor);
    playback.clearFloatingPopupRect();
  }

  function setPopoutRememberPosition(enabled: boolean): void {
    settingsStore.setPopoutRememberPosition(enabled);
    if (!enabled) playback.clearFloatingPopupRect();
  }

  function resetPopoutSettings(): void {
    settingsStore.resetPopoutSettings();
    playback.clearFloatingPopupRect();
  }

  return {
    setPopoutAnchor,
    setPopoutRememberPosition,
    resetPopoutSettings,
  };
}
