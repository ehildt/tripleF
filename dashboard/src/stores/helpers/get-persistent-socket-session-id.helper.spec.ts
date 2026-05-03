import { beforeEach, describe, expect, it } from 'vitest';

import { getPersistentSocketSessionId } from './get-persistent-socket-session-id.helper';

describe('getPersistentSocketSessionId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the stored id when one already exists', () => {
    localStorage.setItem('socket-conversation-id', 'existing-id');

    expect(getPersistentSocketSessionId()).toBe('existing-id');
  });

  it('generates and persists a new id when none exists', () => {
    const id = getPersistentSocketSessionId();

    expect(id).toBeTruthy();
    expect(localStorage.getItem('socket-conversation-id')).toBe(id);
  });

  it('returns the same id on subsequent calls', () => {
    const first = getPersistentSocketSessionId();
    const second = getPersistentSocketSessionId();

    expect(second).toBe(first);
  });
});
