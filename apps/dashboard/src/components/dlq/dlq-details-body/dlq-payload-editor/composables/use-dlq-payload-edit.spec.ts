import { describe, expect, it, vi } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqPayloadEdit } from './use-dlq-payload-edit';

const makeEntry = (payload: DlqEntry['payload']): DlqEntry =>
  ({
    requestId: 'req-1',
    queueName: 'harness',
    jobId: null,
    status: 'Failed',
    payload,
    failedReason: null,
    failedAt: null,
    attemptsMade: 0,
    totalAttempts: 3,
    nextRetryAt: null,
    createdAt: '',
  }) as DlqEntry;

describe('useDlqPayloadEdit', () => {
  it('starts in non-editing state', () => {
    const { isEditingPayload } = useDlqPayloadEdit();
    expect(isEditingPayload.value).toBe(false);
  });

  it('startEdit populates the text buffer and flips to editing', () => {
    const { isEditingPayload, payloadText, startEdit } = useDlqPayloadEdit();
    startEdit(makeEntry({ foo: 'bar' }));
    expect(isEditingPayload.value).toBe(true);
    expect(payloadText.value).toContain('"foo"');
    expect(payloadText.value).toContain('"bar"');
  });

  it('startEdit is a no-op when the entry is null', () => {
    const { isEditingPayload, startEdit } = useDlqPayloadEdit();
    startEdit(null);
    expect(isEditingPayload.value).toBe(false);
  });

  it('cancelEdit returns to non-editing state', () => {
    const { isEditingPayload, startEdit, cancelEdit } = useDlqPayloadEdit();
    startEdit(makeEntry({}));
    cancelEdit();
    expect(isEditingPayload.value).toBe(false);
  });

  it('saveEdit parses valid JSON and exits edit mode', () => {
    const { isEditingPayload, startEdit, saveEdit } = useDlqPayloadEdit();
    startEdit(makeEntry({ a: 1 }));
    const result = saveEdit(makeEntry({ a: 1 }));
    expect(result).toEqual({ a: 1 });
    expect(isEditingPayload.value).toBe(false);
  });

  it('saveEdit returns null for invalid JSON', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { isEditingPayload, payloadText, startEdit, saveEdit } =
      useDlqPayloadEdit();
    startEdit(makeEntry({}));
    payloadText.value = 'not json';
    const result = saveEdit(makeEntry({}));
    expect(result).toBeNull();
    expect(isEditingPayload.value).toBe(true);
    alertSpy.mockRestore();
  });

  it('saveEdit returns null for non-object JSON', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { isEditingPayload, payloadText, startEdit, saveEdit } =
      useDlqPayloadEdit();
    startEdit(makeEntry({}));
    payloadText.value = '[]';
    const result = saveEdit(makeEntry({}));
    expect(result).toBeNull();
    expect(isEditingPayload.value).toBe(true);
    alertSpy.mockRestore();
  });
});
