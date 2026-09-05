import { beforeEach, describe, expect, it, vi } from 'vitest';

const MUTED_STORAGE_KEY = 'vision-toast-muted';

describe('toast-settings.state muted messages', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  async function load() {
    return await import('./toast-settings.state');
  }

  it('defaults to an empty muted list', async () => {
    const { toastMutedMessages } = await load();
    expect(toastMutedMessages.value).toEqual([]);
  });

  it('loads persisted muted messages from storage', async () => {
    localStorage.setItem(
      MUTED_STORAGE_KEY,
      JSON.stringify([{ key: 'toast.a', sample: 'Sample A' }]),
    );
    const { toastMutedMessages } = await load();
    expect(toastMutedMessages.value).toEqual([
      { key: 'toast.a', sample: 'Sample A' },
    ]);
  });

  it('drops malformed entries from storage', async () => {
    localStorage.setItem(
      MUTED_STORAGE_KEY,
      JSON.stringify([
        { key: 'toast.a', sample: 'Sample A' },
        { key: 42 },
        'not-an-object',
        null,
      ]),
    );
    const { toastMutedMessages } = await load();
    expect(toastMutedMessages.value).toEqual([
      { key: 'toast.a', sample: 'Sample A' },
    ]);
  });

  it('muteToastMessage appends once and persists', async () => {
    const { muteToastMessage, toastMutedMessages } = await load();
    muteToastMessage('toast.a', 'Sample A');
    muteToastMessage('toast.a', 'Sample A again');
    expect(toastMutedMessages.value).toEqual([
      { key: 'toast.a', sample: 'Sample A' },
    ]);
    expect(JSON.parse(localStorage.getItem(MUTED_STORAGE_KEY)!)).toEqual(
      toastMutedMessages.value,
    );
  });

  it('unmuteToastMessage removes the kind and persists', async () => {
    const { muteToastMessage, unmuteToastMessage, toastMutedMessages } =
      await load();
    muteToastMessage('toast.a', 'Sample A');
    muteToastMessage('toast.b', 'Sample B');
    unmuteToastMessage('toast.a');
    expect(toastMutedMessages.value).toEqual([
      { key: 'toast.b', sample: 'Sample B' },
    ]);
    expect(JSON.parse(localStorage.getItem(MUTED_STORAGE_KEY)!)).toEqual([
      { key: 'toast.b', sample: 'Sample B' },
    ]);
  });

  it('isToastMessageMuted reflects the list', async () => {
    const { isToastMessageMuted, muteToastMessage } = await load();
    expect(isToastMessageMuted('toast.a')).toBe(false);
    muteToastMessage('toast.a', 'Sample A');
    expect(isToastMessageMuted('toast.a')).toBe(true);
  });

  it('resetToastSettings unmutes everything', async () => {
    const { muteToastMessage, resetToastSettings, toastMutedMessages } =
      await load();
    muteToastMessage('toast.a', 'Sample A');
    resetToastSettings();
    expect(toastMutedMessages.value).toEqual([]);
    expect(JSON.parse(localStorage.getItem(MUTED_STORAGE_KEY)!)).toEqual([]);
  });
});
