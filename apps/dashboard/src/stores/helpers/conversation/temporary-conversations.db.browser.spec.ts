import { beforeEach, describe, expect, it } from 'vitest';

import type { PersistedConversation } from '@/stores/conversation.model';

import { temporaryConversationsDb } from './temporary-conversations.db';

/**
 * Real-DB coverage: runs in the Vitest browser project (real Chromium, real
 * IndexedDB via Playwright) so the Dexie wiring — schema, keyPath, structured
 * clone fidelity — is verified against the actual engine, not a test double.
 * Requires VITEST_ENABLE_BROWSER=true (same flag as the storybook project).
 */
function buildPersistedConversation(
  conversationId: string,
): PersistedConversation {
  return {
    id: `internal-${conversationId}`,
    title: 'Untitled',
    exchanges: [
      {
        id: 'ex-1',
        role: 'user',
        content: 'hello',
        status: 'done',
        timestamp: 1_700_000_000_000,
        toolCalls: [{ name: 'search', category: 'web', status: 'done' }],
      },
    ],
    savedFileInfos: [{ name: 'a.pdf', size: 123, type: 'application/pdf' }],
    uploadedImages: [
      {
        name: 'img.png',
        hash: 'hash-1',
        uploadedAt: 1_700_000_000_000,
        conversationId,
      },
    ],
    uploadedDocuments: [],
    imageSelectionSnapshot: { 'hash-1': true },
    conversationId,
    model: 'llama3',
    numCtx: '8192',
    think: 'medium',
    event: '',
    roomId: '',
    stream: true,
    subscriptions: [{ event: 'news', roomId: 'r1' }],
    type: 'temporary',
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_001_000,
    contextUsagePercent: '12.00',
  };
}

describe('temporaryConversationsDb', () => {
  beforeEach(async () => {
    await temporaryConversationsDb.temporaryConversations.clear();
  });

  it('round-trips a persisted conversation without data loss', async () => {
    const original = buildPersistedConversation('conv-1');
    await temporaryConversationsDb.temporaryConversations.put(original);

    const loaded =
      await temporaryConversationsDb.temporaryConversations.get('conv-1');

    expect(loaded).toEqual(original);
  });

  it('returns undefined for an unknown conversationId', async () => {
    await expect(
      temporaryConversationsDb.temporaryConversations.get('missing'),
    ).resolves.toBeUndefined();
  });

  it('overwrites the same conversationId on repeat puts', async () => {
    await temporaryConversationsDb.temporaryConversations.put(
      buildPersistedConversation('conv-1'),
    );
    const updated = {
      ...buildPersistedConversation('conv-1'),
      title: 'Renamed',
    };
    await temporaryConversationsDb.temporaryConversations.put(updated);

    await expect(
      temporaryConversationsDb.temporaryConversations.count(),
    ).resolves.toBe(1);
    const loaded =
      await temporaryConversationsDb.temporaryConversations.get('conv-1');
    expect(loaded?.title).toBe('Renamed');
  });

  it('delete removes only the targeted record', async () => {
    await temporaryConversationsDb.temporaryConversations.put(
      buildPersistedConversation('conv-1'),
    );
    await temporaryConversationsDb.temporaryConversations.put(
      buildPersistedConversation('conv-2'),
    );

    await temporaryConversationsDb.temporaryConversations.delete('conv-1');

    await expect(
      temporaryConversationsDb.temporaryConversations.get('conv-1'),
    ).resolves.toBeUndefined();
    await expect(
      temporaryConversationsDb.temporaryConversations.get('conv-2'),
    ).resolves.toBeDefined();
  });

  it('bulkDelete removes only the expired records (retention pruning)', async () => {
    await temporaryConversationsDb.temporaryConversations.put(
      buildPersistedConversation('expired-1'),
    );
    await temporaryConversationsDb.temporaryConversations.put(
      buildPersistedConversation('expired-2'),
    );
    await temporaryConversationsDb.temporaryConversations.put(
      buildPersistedConversation('alive'),
    );

    await temporaryConversationsDb.temporaryConversations.bulkDelete([
      'expired-1',
      'expired-2',
    ]);

    const remaining =
      await temporaryConversationsDb.temporaryConversations.toArray();
    expect(remaining.map((c) => c.conversationId)).toEqual(['alive']);
  });
});
