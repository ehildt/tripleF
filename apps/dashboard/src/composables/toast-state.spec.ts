import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const settingsMocks = vi.hoisted(() => ({
  isToastMessageMuted: vi.fn<(key: string) => boolean>(() => false),
  muteToastMessage: vi.fn(),
}));

vi.mock('@/components/widgets/toast/composables/toast-settings.state', () => ({
  toastAutoHide: ref(true),
  toastDurationSeconds: ref(3),
  toastEnabled: ref(true),
  toastMutedMessages: ref([]),
  toastTypeFilters: ref({
    info: true,
    success: true,
    warning: true,
    error: true,
    debug: true,
    default: true,
  }),
  isToastMessageMuted: settingsMocks.isToastMessageMuted,
  muteToastMessage: settingsMocks.muteToastMessage,
}));

describe('useToastState', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    settingsMocks.isToastMessageMuted.mockReset().mockReturnValue(false);
  });

  async function load() {
    return await import('./toast-state');
  }

  it('adds a toast when enabled and the type is allowed', async () => {
    const { useToastState } = await load();
    const { toasts, add } = useToastState();
    add('hello', 'info');
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('hello');
    expect(toasts[0].pinned).toBe(false);
  });

  it('remove removes a toast', async () => {
    const { useToastState } = await load();
    const { toasts, add, remove } = useToastState();
    add('hello', 'info');
    remove(toasts[0].id);
    expect(toasts).toHaveLength(0);
  });

  it('togglePin toggles the pinned flag', async () => {
    const { useToastState } = await load();
    const { toasts, add, togglePin } = useToastState();
    add('hello', 'info');
    togglePin(toasts[0].id);
    expect(toasts[0].pinned).toBe(true);
    togglePin(toasts[0].id);
    expect(toasts[0].pinned).toBe(false);
  });

  it('preview adds an info toast', async () => {
    const { useToastState } = await load();
    const { toasts, preview } = useToastState();
    preview('preview');
    expect(toasts[0].type).toBe('info');
  });

  it('skips toasts whose key is muted', async () => {
    settingsMocks.isToastMessageMuted.mockReturnValue(true);
    const { useToastState } = await load();
    const { toasts, add } = useToastState();
    add('hello', 'info', { key: 'toast.mutedKind' });
    expect(toasts).toHaveLength(0);
  });

  it('adds keyed toasts that are not muted', async () => {
    const { useToastState } = await load();
    const { toasts, add } = useToastState();
    add('hello', 'info', { key: 'toast.someKind' });
    expect(toasts).toHaveLength(1);
    expect(toasts[0].key).toBe('toast.someKind');
  });

  it('muteToast mutes the kind, sweeps visible copies, and confirms', async () => {
    const { useToastState } = await load();
    const { toasts, add, muteToast } = useToastState();
    add('one', 'warning', { key: 'toast.modelNoImages' });
    add('other', 'warning');
    add('two', 'warning', { key: 'toast.modelNoImages' });

    muteToast(toasts[0].id);

    expect(settingsMocks.muteToastMessage).toHaveBeenCalledWith(
      'toast.modelNoImages',
      'one',
    );
    // Both keyed copies are gone; the unkeyed toast stays; the
    // confirmation is appended as a filter-bypassing info toast.
    expect(toasts.map((t) => t.message)).toEqual([
      'other',
      expect.stringContaining('Settings'),
    ]);
    expect(toasts[1].type).toBe('info');
  });

  it('muteToast ignores toasts without a key', async () => {
    const { useToastState } = await load();
    const { toasts, add, muteToast } = useToastState();
    add('plain', 'info');
    muteToast(toasts[0].id);
    expect(settingsMocks.muteToastMessage).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(1);
  });
});
