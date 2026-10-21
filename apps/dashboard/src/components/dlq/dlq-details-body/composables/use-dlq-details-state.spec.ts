import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqDetailsState } from './use-dlq-details-state';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const makeEntry = (
  payload: DlqEntry['payload'],
  status: DlqEntry['status'] = 'Failed',
  failedReason: string | null = null,
): DlqEntry =>
  ({
    requestId: 'req-1',
    queueName: 'harness',
    jobId: null,
    status,
    payload,
    failedReason,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
  }) as DlqEntry;

describe('useDlqDetailsState', () => {
  it('modelExists returns true when the model is in the available list', () => {
    const state = useDlqDetailsState(ref(null), ['llama3', 'mistral']);
    expect(state.modelExists(makeEntry({ filters: { model: 'llama3' } }))).toBe(
      true,
    );
  });

  it('modelExists returns false for a model not in the list', () => {
    const state = useDlqDetailsState(ref(null), ['llama3', 'mistral']);
    expect(
      state.modelExists(makeEntry({ filters: { model: 'unknown' } })),
    ).toBe(false);
  });

  it('modelExists returns false for an entry with no model', () => {
    const state = useDlqDetailsState(ref(null), ['llama3', 'mistral']);
    expect(state.modelExists(makeEntry({}))).toBe(false);
  });

  it('isImmutable returns true for Removed entries', () => {
    const state = useDlqDetailsState(ref(null), []);
    expect(state.isImmutable(makeEntry({}, 'Removed'))).toBe(true);
  });

  it('isImmutable returns false for other statuses', () => {
    const state = useDlqDetailsState(ref(null), []);
    expect(state.isImmutable(makeEntry({}, 'Failed'))).toBe(false);
  });

  it('lists metadata, prompt and payload tabs when the entry has no failure', () => {
    const state = useDlqDetailsState(ref(null), []);
    expect(state.tabs.value.map((tab) => tab.id)).toEqual([
      'metadata',
      'prompt',
      'payload',
    ]);
  });

  it('prepends the error tab when the entry has a failure reason', () => {
    const entry = ref<DlqEntry | null>(makeEntry({}, 'Failed', 'boom'));
    const state = useDlqDetailsState(entry, []);
    expect(state.tabs.value[0]).toEqual({ id: 'error', label: 'common.error' });
  });

  it('resets to the metadata tab when the selected entry changes', async () => {
    const entry = ref<DlqEntry | null>(makeEntry({}, 'Failed', 'boom'));
    const state = useDlqDetailsState(entry, []);
    state.selectTab('error');
    expect(state.activeTab.value).toBe('error');
    entry.value = { ...makeEntry({}, 'Failed', 'boom'), id: 'other-id' };
    await nextTick();
    expect(state.activeTab.value).toBe('metadata');
  });

  it('ignores selecting a tab id that does not exist', () => {
    const state = useDlqDetailsState(ref(null), []);
    state.selectTab('error');
    expect(state.activeTab.value).toBe('metadata');
  });
});
