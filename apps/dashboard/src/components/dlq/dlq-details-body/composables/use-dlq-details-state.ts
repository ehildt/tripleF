import { computed, type Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { DlqEntry } from '../../../../types/dlq-entry.model';
import type { DlqDetailTab } from '../DlqDetailsBody.types';
import { buildPayloadWithFilterUpdate } from '../helpers/build-payload-with-filter-update.helper';
import { getDlqModel } from '../helpers/get-dlq-model.helper';
import { isDlqEntryImmutable } from '../helpers/is-dlq-entry-immutable.helper';
import { useDlqFailureText } from './use-dlq-failure-text';

/**
 * State of the DLQ details panel: entry predicates for the editable sections
 * and the tab strip state (which tabs exist, which one is active). The error
 * tab only exists while the selected entry has a failure text, and switching
 * the selected entry resets the panel to the metadata tab.
 */
export function useDlqDetailsState(
  entry: Ref<DlqEntry | null>,
  models: string[],
) {
  const { t } = useI18n();
  const { failureText } = useDlqFailureText(entry);

  const tabs = computed<Array<{ id: DlqDetailTab; label: string }>>(() => {
    const items: Array<{ id: DlqDetailTab; label: string }> = [];
    if (failureText.value) {
      items.push({ id: 'error', label: t('common.error') });
    }
    items.push(
      { id: 'metadata', label: t('common.metadata') },
      { id: 'prompt', label: t('common.prompt') },
      { id: 'payload', label: t('common.payload') },
    );
    return items;
  });

  const activeTab = ref<DlqDetailTab>('metadata');

  watch(
    () => entry.value?.id,
    () => {
      activeTab.value = 'metadata';
    },
  );

  function selectTab(tabId: string) {
    const match = tabs.value.find((tab) => tab.id === tabId);
    if (match) activeTab.value = match.id;
  }

  return {
    modelExists: (entry: DlqEntry | null) => {
      const m = getDlqModel(entry);
      return !!m && models.includes(m);
    },
    isImmutable: (entry: DlqEntry | null) => isDlqEntryImmutable(entry),
    buildPayloadWithFilterUpdate,
    tabs,
    activeTab,
    selectTab,
  };
}
