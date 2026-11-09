import type { PopoutAnchor } from '@/stores/widgets/popout-settings/popout-settings.types';

export interface PopoutSettingsControls {
  /** Change the anchor and clear geometry left over from the previous anchor. */
  setPopoutAnchor: (anchor: PopoutAnchor) => void;
  /** Change position memory and clear geometry when memory is disabled. */
  setPopoutRememberPosition: (enabled: boolean) => void;
  /** Restore preference defaults and clear live/persisted geometry. */
  resetPopoutSettings: () => void;
}
