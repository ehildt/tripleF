import { computed, type Ref, ref } from 'vue';

import { i18n } from '@/i18n/i18n';

import type {
  ProviderKey,
  ProviderOverridesSnapshot,
} from '../../settings-config.model';
import { type IntegrationId, INTEGRATIONS } from '../integrations.model';
import type { IntegrationTileView } from './use-integrations-drawer.types';

/** Read the enabled flag straight from the snapshot section, if it has one. */
function providerEnabled(
  config: ProviderOverridesSnapshot | null,
  id: IntegrationId,
): boolean | null {
  const section = config?.[id] as { enabled?: boolean } | undefined;
  return section && 'enabled' in section ? !!section.enabled : null;
}

/**
 * State for the integrations grid: the resolved tile view models, the
 * open/closed slide-over drawer, and the quick-toggle gating — enabling an
 * integration without credentials opens its configuration drawer instead
 * of flipping the switch (disabling always works instantly).
 */
export function useIntegrationsDrawer(
  config: Ref<ProviderOverridesSnapshot | null>,
  toggleProviderEnabled: (provider: ProviderKey) => void,
) {
  /** Which integration's drawer is mounted (kept during the leave transition). */
  const drawerIntegration = ref<IntegrationId | null>(null);
  const drawerOpen = ref(false);

  const tiles = computed<IntegrationTileView[]>(() =>
    INTEGRATIONS.map((meta) => {
      const enabled = providerEnabled(config.value, meta.id);
      const configured = config.value ? meta.isConfigured(config.value) : false;
      const name = i18n.global.t(meta.nameKey);
      return {
        meta,
        name,
        description: i18n.global.t(meta.descriptionKey),
        enabled,
        configured,
        toggleTitle: meta.toggleTitleKey
          ? i18n.global.t(meta.toggleTitleKey)
          : undefined,
        openLabel: i18n.global.t('common.integrationOpenConfig', { name }),
      };
    }),
  );

  const drawerMeta = computed(
    () =>
      INTEGRATIONS.find((meta) => meta.id === drawerIntegration.value) ?? null,
  );

  const drawerTitle = computed(() =>
    drawerMeta.value ? i18n.global.t(drawerMeta.value.nameKey) : '',
  );

  function openIntegration(id: IntegrationId) {
    drawerIntegration.value = id;
    drawerOpen.value = true;
  }

  function closeIntegration() {
    drawerOpen.value = false;
  }

  /** Slide-over leave transition finished — drop the drawer body. */
  function onDrawerClosed() {
    drawerIntegration.value = null;
  }

  /**
   * Quick-toggle on a tile. Enabling requires credentials: without them the
   * click falls through to the configuration drawer instead. Disabling and
   * re-enabling a configured integration flip the switch instantly.
   */
  function toggleIntegration(id: IntegrationId) {
    const meta = INTEGRATIONS.find((entry) => entry.id === id);
    if (!meta?.toggleable || !config.value) return;
    if (
      !providerEnabled(config.value, id) &&
      !meta.isConfigured(config.value)
    ) {
      openIntegration(id);
      return;
    }
    toggleProviderEnabled(id as ProviderKey);
  }

  return {
    tiles,
    drawerIntegration,
    drawerOpen,
    drawerTitle,
    openIntegration,
    closeIntegration,
    onDrawerClosed,
    toggleIntegration,
  };
}
