import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import { fetchMemoryCognition, wipeMemoryCognition } from '@/api/memory.api';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';
import { getPersistentSocketSessionId } from '@/stores/helpers/socket/get-persistent-socket-session-id.helper';

/** Disarm window for the two-click wipe confirm (armed state auto-clears). */
const WIPE_ARM_WINDOW_MS = 4000;

/**
 * The SysCtl "Memory cognition" display: shows the AI's accumulated
 * understanding of the user for the active cognition space (the sysctl
 * cognition id, else the memory partition, else the session id) — the
 * structured profile document plus the derived insights — and offers refresh
 * + an armed two-click wipe. Reads on mount and on every space change; a
 * fetch failure degrades to an unavailable note — memory being off must
 * never break the settings tab.
 */
export function useMemoryCognition() {
  const { memoryCognition, memoryPartition } = storeToRefs(useAppStore());
  const cognitionKey = computed(
    () =>
      memoryCognition.value.trim() ||
      memoryPartition.value.trim() ||
      getPersistentSocketSessionId(),
  );

  const profileText = ref<string | null>(null);
  const insights = ref<Array<{ text: string; path?: string }>>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  const wipeArmed = ref(false);
  let wipeDisarmTimer: ReturnType<typeof setTimeout> | undefined;

  const hasCognition = computed(
    () => !!profileText.value?.trim() || insights.value.length > 0,
  );

  /** Pretty-print the stored profile JSON for display (falls back to raw text). */
  const profileDisplay = computed(() => {
    const raw = profileText.value?.trim();
    if (!raw) return '';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  });

  /** The panel body: profile document, then the probed-insights section. */
  const cognitionDisplay = computed(() => {
    const parts: string[] = [];
    if (profileDisplay.value) parts.push(profileDisplay.value);
    if (insights.value.length > 0) {
      const heading = i18n.global.t('common.memoryCognitionInsights');
      const lines = insights.value.map((insight) =>
        insight.path
          ? `- [${insight.path}] ${insight.text}`
          : `- ${insight.text}`,
      );
      parts.push(`[${heading}]\n${lines.join('\n')}`);
    }
    return parts.join('\n\n');
  });

  async function refreshCognition() {
    isLoading.value = true;
    isUnavailable.value = false;
    try {
      const snapshot = await fetchMemoryCognition(cognitionKey.value);
      profileText.value = snapshot.profile;
      insights.value = snapshot.insights;
    } catch {
      profileText.value = null;
      insights.value = [];
      isUnavailable.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /** First click arms (a second within the window executes), then the space is re-read. */
  async function handleWipeClick() {
    if (!wipeArmed.value) {
      wipeArmed.value = true;
      wipeDisarmTimer = setTimeout(() => {
        wipeArmed.value = false;
      }, WIPE_ARM_WINDOW_MS);
      return;
    }
    clearTimeout(wipeDisarmTimer);
    wipeArmed.value = false;
    try {
      await wipeMemoryCognition(cognitionKey.value);
    } finally {
      await refreshCognition();
    }
  }

  onMounted(refreshCognition);
  watch(cognitionKey, refreshCognition);

  return {
    cognitionDisplay,
    profileDisplay,
    insights,
    isLoading,
    isUnavailable,
    wipeArmed,
    hasCognition,
    refreshCognition,
    handleWipeClick,
  };
}
