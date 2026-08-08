import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/components/widgets/toast/composables/toast-settings.state', () => ({
  toastAutoHide: ref(true),
  toastDurationSeconds: ref(3),
  toastEnabled: ref(true),
  toastTypeFilters: ref({
    info: true,
    success: true,
    warning: true,
    error: true,
    debug: true,
    default: true,
  }),
}));

describe('useToastState', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
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
});
