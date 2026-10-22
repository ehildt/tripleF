import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useToastSettingsStore } from '@/stores/toast-settings/toast-settings.store';

import { useToastQueue } from './use-toast-queue';

describe('useToastQueue', () => {
  beforeAll(() => {
    // The engine's module-scope auto-hide watcher binds the settings store
    // once — the singleton and its pinia must share one file-lifetime pinia,
    // so tests reset state explicitly instead of re-creating pinia.
    setActivePinia(createPinia());
  });

  beforeEach(() => {
    localStorage.clear();
    // Module-scope singleton: drain queued toasts and reset the settings
    // store between tests (pending timers dissolve when each test swaps
    // fake/real timers).
    useToastQueue().toasts.length = 0;
    const settings = useToastSettingsStore();
    settings.resetToastSettings();
    // Defaults filter everything but warning/error — enable all types so the
    // tests exercise the engine, not the default filter table.
    for (const type of [
      'info',
      'success',
      'warning',
      'error',
      'debug',
      'default',
    ] as const) {
      settings.setToastTypeFilter(type, true);
    }
  });

  it('adds a toast and auto-removes it after the default duration', () => {
    vi.useFakeTimers();
    const queue = useToastQueue();

    queue.add('hello', 'info');
    expect(queue.toasts).toHaveLength(1);
    expect(queue.toasts[0].type).toBe('info');
    expect(queue.toasts[0].message).toBe('hello');

    vi.advanceTimersByTime(12000);
    expect(queue.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('respects the master toggle and the per-type filter', () => {
    const settings = useToastSettingsStore();
    const queue = useToastQueue();

    settings.setToastEnabled(false);
    queue.add('hidden', 'info');
    expect(queue.toasts).toHaveLength(0);

    settings.setToastEnabled(true);
    settings.setToastTypeFilter('error', false);
    queue.add('filtered', 'error');
    expect(queue.toasts).toHaveLength(0);

    settings.setToastTypeFilter('error', true);
    queue.add('shown', 'error');
    expect(queue.toasts).toHaveLength(1);
  });

  it('skips muted message kinds', () => {
    const settings = useToastSettingsStore();
    const queue = useToastQueue();

    settings.muteToastMessage('k-model-vision', 'sample text');
    queue.add('sample text', 'warning', { key: 'k-model-vision' });
    expect(queue.toasts).toHaveLength(0);
  });

  it('pause freezes the countdown and resume continues it', () => {
    vi.useFakeTimers();
    const settings = useToastSettingsStore();
    settings.setToastDurationSeconds(10);
    const queue = useToastQueue();
    queue.add('tick', 'info');

    vi.advanceTimersByTime(4000);
    queue.pause(queue.toasts[0].id);
    vi.advanceTimersByTime(30000);
    expect(queue.toasts).toHaveLength(1); // still on screen while frozen

    queue.resume(queue.toasts[0].id);
    vi.advanceTimersByTime(5500);
    expect(queue.toasts).toHaveLength(1); // ~6s remain
    vi.advanceTimersByTime(1000);
    expect(queue.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('togglePin keeps the toast on screen; unpinning resumes the countdown', () => {
    vi.useFakeTimers();
    const queue = useToastQueue();
    queue.add('pin me', 'info');
    const id = queue.toasts[0].id;

    queue.togglePin(id);
    vi.advanceTimersByTime(60000);
    expect(queue.toasts).toHaveLength(1);
    expect(queue.toasts[0].pinned).toBe(true);

    queue.togglePin(id);
    vi.advanceTimersByTime(12000);
    expect(queue.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('preview bypasses the master toggle', () => {
    const settings = useToastSettingsStore();
    settings.setToastEnabled(false);
    const queue = useToastQueue();

    queue.preview('example');
    expect(queue.toasts).toHaveLength(1);
  });

  it('muteToast mutes the kind, sweeps visible copies, and confirms', () => {
    const settings = useToastSettingsStore();
    const queue = useToastQueue();

    queue.add('first copy', 'warning', { key: 'k-clamp' });
    queue.add('second copy', 'warning', { key: 'k-clamp' });
    expect(queue.toasts).toHaveLength(2);

    queue.muteToast(queue.toasts[0].id);

    expect(settings.isToastMessageMuted('k-clamp')).toBe(true);
    expect(queue.toasts.filter((t) => t.key === 'k-clamp')).toHaveLength(0);
    expect(queue.toasts).toHaveLength(1); // the confirmation info toast
    expect(queue.toasts[0].type).toBe('info');
  });

  it('toggling auto-hide applies to toasts already on screen', async () => {
    vi.useFakeTimers();
    const settings = useToastSettingsStore();
    const queue = useToastQueue();
    queue.add('linger', 'info');

    settings.setToastAutoHide(false);
    await nextTick();
    vi.advanceTimersByTime(60000);
    expect(queue.toasts).toHaveLength(1);

    settings.setToastAutoHide(true);
    await nextTick();
    vi.advanceTimersByTime(12000);
    expect(queue.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('remove deletes the toast and clears its timer', () => {
    vi.useFakeTimers();
    const queue = useToastQueue();
    queue.add('bye', 'info');
    const id = queue.toasts[0].id;

    queue.remove(id);
    expect(queue.toasts).toHaveLength(0);
    vi.advanceTimersByTime(60000);
    expect(queue.toasts).toHaveLength(0);
    vi.useRealTimers();
  });
});
