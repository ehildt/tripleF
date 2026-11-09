import { usePreprocessingSettingsStore } from '@/stores/preprocessing-settings/preprocessing-settings.store';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

import { createPreprocessingSettingsSync } from '../create-preprocessing-settings-sync/create-preprocessing-settings-sync';
import type { PreprocessingSettingsSync } from '../create-preprocessing-settings-sync/create-preprocessing-settings-sync.types';

let settingsSync: PreprocessingSettingsSync | null = null;

/** Read the app-level preprocessing synchronization singleton shared by App and preview. */
export function usePreprocessingSettingsSync(): PreprocessingSettingsSync {
  settingsSync ??= createPreprocessingSettingsSync(
    usePreprocessingSettingsStore(),
    getPersistentSocketSessionId(),
  );
  return settingsSync;
}
