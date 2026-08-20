import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import { useAppStore } from '@/stores/app';

import type { ChatPromptActionBarProps } from '../ChatPromptActionBar.types';
import { useChatPromptActionBar } from './use-chat-prompt-action-bar.composable';

let activePinia: ReturnType<typeof createPinia>;

function makeProps(
  overrides: Partial<ChatPromptActionBarProps> = {},
): ChatPromptActionBarProps {
  return reactive({
    conversationId: '',
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
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
    localStorage.clear();
  });

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

  it('reads the per-conversation scroll mode from the app store', () => {
    const appStore = useAppStore();
    appStore.setConversationScrollMode('conv-1', 'native');

    const { scrollMode } = useChatPromptActionBar(
      makeProps({ conversationId: 'conv-1' }),
      vi.fn(),
    );
    expect(scrollMode.value).toBe('native');
  });

  it('toggles the conversation scroll mode between carousel and native', () => {
    const appStore = useAppStore();
    const { scrollMode, toggleScrollMode } = useChatPromptActionBar(
      makeProps({ conversationId: 'conv-1' }),
      vi.fn(),
    );

    expect(scrollMode.value).toBe('carousel');
    toggleScrollMode();
    expect(scrollMode.value).toBe('native');
    expect(appStore.getConversationScrollMode('conv-1')).toBe('native');
  });

  it('reads the sources menu collapse state from the app store', () => {
    const appStore = useAppStore();
    appStore.setSourceTagsMenuCollapsed('sources', true);

    const { sourceMenuCollapsed } = useChatPromptActionBar(
      makeProps(),
      vi.fn(),
    );
    expect(sourceMenuCollapsed.value).toBe(true);
  });

  it('toggles the sources menu collapse state per conversation', () => {
    const appStore = useAppStore();
    const { sourceMenuCollapsed, toggleSourceMenuCollapsed } =
      useChatPromptActionBar(makeProps({ conversationId: 'conv-1' }), vi.fn());

    expect(sourceMenuCollapsed.value).toBe(false);
    toggleSourceMenuCollapsed();
    expect(sourceMenuCollapsed.value).toBe(true);
    expect(appStore.getSourceMenuCollapsed('conv-1', 'sources')).toBe(true);
    // Other conversations keep the global default.
    expect(appStore.getSourceMenuCollapsed('conv-2', 'sources')).toBe(false);
  });

  it('toggles the view menu collapse state independently per conversation', () => {
    const appStore = useAppStore();
    const { viewMenuCollapsed, toggleViewMenuCollapsed } =
      useChatPromptActionBar(makeProps({ conversationId: 'conv-1' }), vi.fn());

    expect(viewMenuCollapsed.value).toBe(false);
    toggleViewMenuCollapsed();
    expect(viewMenuCollapsed.value).toBe(true);
    expect(appStore.getSourceMenuCollapsed('conv-1', 'view')).toBe(true);
    expect(appStore.getSourceMenuCollapsed('conv-1', 'sources')).toBe(false);
  });

  it('defaults both menus to always show', () => {
    const { sourceMenuAlwaysShow, viewMenuAlwaysShow } = useChatPromptActionBar(
      makeProps(),
      vi.fn(),
    );

    expect(sourceMenuAlwaysShow.value).toBe(true);
    expect(viewMenuAlwaysShow.value).toBe(true);
  });

  it('reads the menu always-show state from the app store', () => {
    const appStore = useAppStore();
    appStore.setSourceTagsMenuAlwaysShow('view', false);

    const { viewMenuAlwaysShow } = useChatPromptActionBar(makeProps(), vi.fn());
    expect(viewMenuAlwaysShow.value).toBe(false);
  });

  it('builds one section toggle per collapsible section type', () => {
    const { sectionToggles } = useChatPromptActionBar(makeProps(), vi.fn());

    expect(sectionToggles.value.map((toggle) => toggle.key)).toEqual([
      'sources',
      'keyFindings',
      'internationalCoverage',
    ]);
    expect(sectionToggles.value.every((toggle) => !toggle.hidden)).toBe(true);
  });

  it('reflects the store collapse state in the section toggles', () => {
    const appStore = useAppStore();
    appStore.setSectionCollapsed('sources', true);

    const { sectionToggles } = useChatPromptActionBar(makeProps(), vi.fn());
    const sourcesToggle = sectionToggles.value.find(
      (toggle) => toggle.key === 'sources',
    );
    expect(sourcesToggle?.hidden).toBe(true);
  });

  it('toggleSection flips the store collapse state', () => {
    const appStore = useAppStore();
    const { toggleSection } = useChatPromptActionBar(makeProps(), vi.fn());

    toggleSection('sources');
    expect(appStore.collapsedSections.sources).toBe(true);
    toggleSection('sources');
    expect(appStore.collapsedSections.sources).toBe(false);
  });

  it('builds one presentation toggle per media section type', () => {
    const { presentationToggles } = useChatPromptActionBar(
      makeProps(),
      vi.fn(),
    );

    expect(presentationToggles.value.map((toggle) => toggle.key)).toEqual([
      'gallery',
      'videoGallery',
    ]);
    expect(presentationToggles.value.map((toggle) => toggle.media)).toEqual([
      'image',
      'video',
    ]);
    expect(
      presentationToggles.value.find((toggle) => toggle.media === 'image')
        ?.presentation,
    ).toBe('gallery');
    expect(
      presentationToggles.value.find((toggle) => toggle.media === 'video')
        ?.presentation,
    ).toBe('list');
  });

  it('reflects the store presentation state in the presentation toggles', () => {
    const appStore = useAppStore();
    appStore.setMediaPresentation('image', 'list');

    const { presentationToggles } = useChatPromptActionBar(
      makeProps(),
      vi.fn(),
    );
    const galleryToggle = presentationToggles.value.find(
      (toggle) => toggle.media === 'image',
    );
    expect(galleryToggle?.presentation).toBe('list');
  });

  it('togglePresentation flips the store presentation state', () => {
    const appStore = useAppStore();
    const { togglePresentation } = useChatPromptActionBar(makeProps(), vi.fn());

    togglePresentation('image');
    expect(appStore.mediaPresentations.image).toBe('list');
    togglePresentation('image');
    expect(appStore.mediaPresentations.image).toBe('gallery');
  });
});
