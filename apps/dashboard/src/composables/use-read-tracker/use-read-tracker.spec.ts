import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useReadTracker } from './use-read-tracker';

describe('useReadTracker', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks ids as read once, ignoring duplicates', () => {
    const tracker = useReadTracker('test-reads');
    tracker.markAsRead('a');
    tracker.markAsRead('a');
    tracker.markAsRead('b');
    expect(tracker.readCount.value).toBe(2);
    expect(tracker.isRead('a')).toBe(true);
  });

  it('persists to localStorage under the given key', async () => {
    useReadTracker('my-key').markAsRead('x');
    await nextTick(); // useStorage persists across a watcher tick
    expect(useReadTracker('my-key').isRead('x')).toBe(true);
  });

  it('keeps separate read sets per storage key', () => {
    useReadTracker('one').markAsRead('x');
    expect(useReadTracker('two').isRead('x')).toBe(false);
  });

  it('counts unread among live ids only', () => {
    const tracker = useReadTracker('live');
    tracker.markAsRead('a');
    tracker.markAsRead('stale'); // no longer live — must not skew the count
    expect(tracker.unreadCount(['a', 'b', 'c'])).toBe(2);
  });

  it('ignores an empty id', () => {
    const tracker = useReadTracker('empty');
    tracker.markAsRead('');
    expect(tracker.readCount.value).toBe(0);
  });

  it('removeRead unmarks a previously read id', () => {
    const tracker = useReadTracker('rm');
    tracker.markAsRead('a');
    tracker.removeRead('a');
    expect(tracker.isRead('a')).toBe(false);
    tracker.removeRead('never-read'); // no-op, no throw
  });
});
