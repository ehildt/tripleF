import type { DlqEntry } from '../../../../types/dlq-entry.model';
import { buildPayloadWithFilterUpdate } from '../helpers/build-payload-with-filter-update.helper';
import { getDlqModel } from '../helpers/get-dlq-model.helper';
import { isDlqEntryImmutable } from '../helpers/is-dlq-entry-immutable.helper';

export function useDlqDetailsState(models: string[]) {
  return {
    modelExists: (entry: DlqEntry | null) => {
      const m = getDlqModel(entry);
      return !!m && models.includes(m);
    },
    isImmutable: (entry: DlqEntry | null) => isDlqEntryImmutable(entry),
    buildPayloadWithFilterUpdate,
  };
}
