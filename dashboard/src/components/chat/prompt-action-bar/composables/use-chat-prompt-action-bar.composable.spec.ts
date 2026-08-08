import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import type { ChatPromptActionBarProps } from '../ChatPromptActionBar.types';
import { useChatPromptActionBar } from './use-chat-prompt-action-bar.composable';

function makeProps(
  overrides: Partial<ChatPromptActionBarProps> = {},
): ChatPromptActionBarProps {
  return reactive({
    value: '',
    thinkOptions: [],
    thinkValue: 'medium',
    contextSizeOptions: [],
    contextSizeValue: '',
    defaultContextSize: '',
    formatContextSize: (v: string) => v,
    isDisabled: false,
    isFileSelectDisabled: false,
    setActionBarRef: vi.fn(),
    setThinkDropdownRef: vi.fn(),
    setContextSizeDropdownRef: vi.fn(),
    ...overrides,
  });
}

describe('useChatPromptActionBar', () => {
  it('hides the source tags when no search engine is enabled', () => {
    const { sourceTags } = useChatPromptActionBar(
      makeProps({ searchEngineState: 'unknown' }),
      vi.fn(),
    );
    expect(sourceTags.value).toEqual([]);
  });

  it('builds one tag per enabled source', () => {
    const { sourceTags } = useChatPromptActionBar(
      makeProps({
        searchEngineState: 'enabled',
        searchSources: [
          { key: 'web', enabled: true },
          { key: 'images', enabled: false },
        ],
      }),
      vi.fn(),
    );
    expect(sourceTags.value).toHaveLength(2);
    expect(sourceTags.value[0].key).toBe('web');
    expect(sourceTags.value[0].enabled).toBe(true);
    expect(sourceTags.value[1].enabled).toBe(false);
  });

  it('falls back to the key for unknown sources', () => {
    const { sourceTags } = useChatPromptActionBar(
      makeProps({
        searchEngineState: 'enabled',
        searchSources: [{ key: 'mystery', enabled: true }],
      }),
      vi.fn(),
    );
    expect(sourceTags.value[0].label).toBe('mystery');
  });

  it('emits disabledHoverStart only when the file button is disabled', () => {
    const emit = vi.fn();
    const { onFileButtonMouseEnter } = useChatPromptActionBar(
      makeProps({ isFileSelectDisabled: true }),
      emit,
    );
    onFileButtonMouseEnter();
    expect(emit).toHaveBeenCalledWith('disabledHoverStart');
  });
});
