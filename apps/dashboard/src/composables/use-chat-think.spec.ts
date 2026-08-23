import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import { useChatThink } from './use-chat-think';

vi.mock('@/i18n/i18n', () => ({
  i18n: { global: { t: (key: string) => key } },
}));

const createStore = () => ({ setThink: vi.fn() });
const createToast = () => ({ warning: vi.fn() });

describe('useChatThink', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to medium', () => {
    const { selectedThink } = useChatThink(
      computed(() => null),
      ref(''),
      createStore() as never,
      createToast() as never,
    );
    expect(selectedThink.value).toBe('medium');
  });

  it('reads the persisted think level', () => {
    localStorage.setItem('harness-selected-think', 'high');
    const { selectedThink } = useChatThink(
      computed(() => null),
      ref(''),
      createStore() as never,
      createToast() as never,
    );
    expect(selectedThink.value).toBe('high');
  });

  it('supports thinking when the model has the capability', () => {
    const model = { capabilities: ['thinking'] };
    const { supportsThink, filteredThinkOptions } = useChatThink(
      computed(() => model as never),
      ref(''),
      createStore() as never,
      createToast() as never,
    );
    expect(supportsThink.value).toBe(true);
    expect(filteredThinkOptions.value).toEqual([
      'off',
      'low',
      'medium',
      'high',
    ]);
  });

  it('restricts options to off when the model lacks thinking', () => {
    const model = { capabilities: [] };
    const { supportsThink, filteredThinkOptions } = useChatThink(
      computed(() => model as never),
      ref(''),
      createStore() as never,
      createToast() as never,
    );
    expect(supportsThink.value).toBe(false);
    expect(filteredThinkOptions.value).toEqual(['off']);
  });

  it('selectThink persists and updates the conversation', () => {
    const store = createStore();
    const { selectThink } = useChatThink(
      computed(() => null),
      ref('conv-1'),
      store as never,
      createToast() as never,
    );
    selectThink('low');
    expect(localStorage.getItem('harness-selected-think')).toBe('low');
    expect(store.setThink).toHaveBeenCalledWith('conv-1', 'low');
  });

  it('selectThink does not touch the store without a conversation id', () => {
    const store = createStore();
    const { selectThink } = useChatThink(
      computed(() => null),
      ref(''),
      store as never,
      createToast() as never,
    );
    selectThink('off');
    expect(store.setThink).not.toHaveBeenCalled();
  });

  it('warns and resets to off when a non-thinking model is selected', async () => {
    const toast = createToast();
    const model = ref<{ capabilities: string[] } | null>({
      capabilities: ['thinking'],
    });
    const { selectedThink } = useChatThink(
      computed(() => model.value),
      ref(''),
      createStore() as never,
      toast as never,
    );
    selectedThink.value = 'high';
    model.value = { capabilities: [] };
    await Promise.resolve();
    expect(selectedThink.value).toBe('off');
    expect(toast.warning).toHaveBeenCalled();
  });
});
