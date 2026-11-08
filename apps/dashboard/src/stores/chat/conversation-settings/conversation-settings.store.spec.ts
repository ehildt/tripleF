import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useConversationSettingsStore } from './conversation-settings.store';

describe('useConversationSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('defaults temporary retention to seven days', () => {
    expect(useConversationSettingsStore().temporaryRetentionMinutes).toBe(
      10080,
    );
  });

  it('clamps negative retention to zero and accepts positive values', () => {
    const store = useConversationSettingsStore();
    store.setTemporaryRetentionMinutes(-5);
    expect(store.temporaryRetentionMinutes).toBe(0);
    store.setTemporaryRetentionMinutes(30);
    expect(store.temporaryRetentionMinutes).toBe(30);
  });

  it('defaults and updates the document text limit', () => {
    const store = useConversationSettingsStore();
    expect(store.documentTextLimit).toBe(200_000);
    store.setDocumentTextLimit(1000);
    expect(store.documentTextLimit).toBe(1000);
  });
});
