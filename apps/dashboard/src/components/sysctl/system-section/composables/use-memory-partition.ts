import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import { fetchMemoryFacts, wipeMemoryFacts } from '@/api/memory.api';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';
import { getPersistentSocketSessionId } from '@/stores/helpers/socket/get-persistent-socket-session-id.helper';

/** Disarm window for the two-click wipe confirm (armed state auto-clears). */
const WIPE_ARM_WINDOW_MS = 4000;
/** The listing page cap — the panel notes when the partition outgrows it. */
const FACTS_PAGE_LIMIT = 100;

/**
 * The SysCtl "Memory partition" display: the user's stored fact records for
 * the active partition key (the memoryPartition sysctl value, else the
 * persistent session id) — the statements they made or asked the AI to
 * remember, the other half of the memory story beside the cognition panel.
 * Reads on mount and on every key change; a fetch failure degrades to an
 * unavailable note — memory being off must never break the settings tab.
 */
export function useMemoryPartition() {
  const { memoryPartition } = storeToRefs(useAppStore());
  const partitionKey = computed(
    () => memoryPartition.value.trim() || getPersistentSocketSessionId(),
  );

  const facts = ref<Array<{ text: string; createdAt?: string }>>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  const wipeArmed = ref(false);
  let wipeDisarmTimer: ReturnType<typeof setTimeout> | undefined;

  const hasFacts = computed(() => facts.value.length > 0);
  const isTruncated = computed(() => facts.value.length === FACTS_PAGE_LIMIT);

  /** The panel body: one dated line per fact record (bracket style, like the insight list). */
  const factsDisplay = computed(() => {
    const lines = facts.value.map((fact) => {
      const day = fact.createdAt?.slice(0, 10);
      return day ? `- [${day}] ${fact.text}` : `- ${fact.text}`;
    });
    if (isTruncated.value) {
      lines.push(
        `\n[${i18n.global.t('common.memoryPartitionLimited', {
          count: FACTS_PAGE_LIMIT,
        })}]`,
      );
    }
    return lines.join('\n');
  });

  async function refreshFacts() {
    isLoading.value = true;
    isUnavailable.value = false;
    try {
      facts.value = await fetchMemoryFacts(partitionKey.value);
    } catch {
      facts.value = [];
      isUnavailable.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  /** First click arms (a second within the window executes), then the partition is re-read. */
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
      await wipeMemoryFacts(partitionKey.value);
    } finally {
      await refreshFacts();
    }
  }

  onMounted(refreshFacts);
  watch(partitionKey, refreshFacts);

  return {
    factsDisplay,
    isLoading,
    isUnavailable,
    wipeArmed,
    hasFacts,
    refreshFacts,
    handleWipeClick,
  };
}
