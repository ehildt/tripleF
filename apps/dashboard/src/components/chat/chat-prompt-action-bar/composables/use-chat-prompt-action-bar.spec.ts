import {
  Clapperboard,
  Globe,
  Image,
  Images,
  Key,
  Languages,
  Link,
  Search,
} from '@lucide/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';

import { useChatPromptActionBar } from './use-chat-prompt-action-bar.composable';

/** Mutable reactive inputs owned by the mocked dependency composables. The
 * mock factories assign the refs once on first call; tests mutate `.value`
 * between cases to drive the bar's derived computeds. */
const refs = vi.hoisted(() => ({})) as {
  conversationId: Ref<string>;
  conversation: Ref<Record<string, unknown>>;
  selectedModelObj: Ref<{ capabilities?: string[] }>;
  defaultContextSize: Ref<number>;
  searchEngineState: Ref<string>;
  searchSources: Ref<{ key: string; enabled: boolean }[]>;
  eodhdState: Ref<{ enabled: boolean; available: boolean }>;
};

/** Stable mock functions and non-reactive inputs the stores read. */
const state = vi.hoisted(() => ({
  t: vi.fn((key: string, params?: Record<string, unknown>) => {
    const values = params ? Object.values(params) : [];
    return values.length ? `${key}[${values.join('|')}]` : key;
  }),
  // models store
  selectedModel: 'gpt-4o',
  fetchModels: vi.fn(),
  // app store
  getConversationScrollMode: vi.fn(),
  setConversationScrollMode: vi.fn(),
  getSourceMenuCollapsed: vi.fn(),
  setSourceMenuCollapsed: vi.fn(),
  getSourceMenuAlwaysShow: vi.fn(),
  sourceMenuCollapsed: false,
  viewMenuCollapsed: false,
  sourceMenuAlwaysShow: false,
  viewMenuAlwaysShow: false,
  collapsedSections: {
    sources: false,
    keyFindings: false,
    internationalCoverage: false,
  },
  mediaPresentations: { image: 'gallery', video: 'gallery' },
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: state.t }),
}));

vi.mock('@/stores/models', () => ({
  useModelsStore: () => ({
    get selectedModel() {
      return state.selectedModel;
    },
    fetchModels: state.fetchModels,
  }),
}));

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    getConversationScrollMode: state.getConversationScrollMode,
    setConversationScrollMode: state.setConversationScrollMode,
    getSourceMenuCollapsed: state.getSourceMenuCollapsed,
    setSourceMenuCollapsed: state.setSourceMenuCollapsed,
    getSourceMenuAlwaysShow: state.getSourceMenuAlwaysShow,
    collapsedSections: state.collapsedSections,
    mediaPresentations: state.mediaPresentations,
  }),
}));

vi.mock('../../composables/use-chat-conversation', async () => {
  const { ref } = await import('vue');
  refs.conversationId = ref('conv-1');
  refs.conversation = ref<Record<string, unknown>>({});
  refs.selectedModelObj = ref<{ capabilities?: string[] }>({
    capabilities: ['vision'],
  });
  return {
    useChatConversation: () => ({
      conversationId: refs.conversationId,
      conversation: refs.conversation,
      selectedModelObj: refs.selectedModelObj,
    }),
  };
});

vi.mock('../../composables/use-chat-context-size', async () => {
  const { ref } = await import('vue');
  refs.defaultContextSize = ref(4096);
  return {
    useChatContextSize: () => ({
      defaultContextSize: refs.defaultContextSize,
    }),
  };
});

vi.mock('../../composables/use-search-engine-availability', async () => {
  const { ref } = await import('vue');
  refs.searchEngineState = ref('enabled');
  refs.searchSources = ref<{ key: string; enabled: boolean }[]>([]);
  refs.eodhdState = ref<{ enabled: boolean; available: boolean }>({
    enabled: false,
    available: true,
  });
  return {
    useSearchEngineAvailability: () => ({
      searchEngineState: refs.searchEngineState,
      searchSources: refs.searchSources,
      eodhdState: refs.eodhdState,
    }),
  };
});

function setup() {
  return useChatPromptActionBar();
}

describe('useChatPromptActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    refs.conversationId.value = 'conv-1';
    refs.conversation.value = {};
    refs.selectedModelObj.value = { capabilities: ['vision'] };
    refs.defaultContextSize.value = 4096;
    refs.searchEngineState.value = 'enabled';
    refs.searchSources.value = [];
    refs.eodhdState.value = { enabled: false, available: true };

    state.selectedModel = 'gpt-4o';
    state.sourceMenuCollapsed = false;
    state.viewMenuCollapsed = false;
    state.sourceMenuAlwaysShow = false;
    state.viewMenuAlwaysShow = false;
    state.collapsedSections.sources = false;
    state.collapsedSections.keyFindings = false;
    state.collapsedSections.internationalCoverage = false;
    state.mediaPresentations.image = 'gallery';
    state.mediaPresentations.video = 'gallery';

    state.getConversationScrollMode.mockReturnValue('carousel');
    state.getSourceMenuCollapsed.mockImplementation((...args) =>
      args[1] === 'sources'
        ? state.sourceMenuCollapsed
        : state.viewMenuCollapsed,
    );
    state.getSourceMenuAlwaysShow.mockImplementation((...args) =>
      args[1] === 'sources'
        ? state.sourceMenuAlwaysShow
        : state.viewMenuAlwaysShow,
    );
  });

  it('derives the selected model name from the conversation, falling back to the store', () => {
    refs.conversation.value = { model: 'claude-3' };
    expect(setup().hasNoModelSelected.value).toBe(false);

    refs.conversation.value = {};
    expect(setup().hasNoModelSelected.value).toBe(false);

    state.selectedModel = '';
    expect(setup().hasNoModelSelected.value).toBe(true);
  });

  it('derives think and context-size defaults from the conversation', () => {
    const { currentThinkValue, currentContextSizeValue } = setup();
    expect(currentThinkValue.value).toBe('medium');
    expect(currentContextSizeValue.value).toBe(4096);

    refs.conversation.value = { think: 'high', numCtx: 8192 };
    expect(setup().currentThinkValue.value).toBe('high');
    expect(setup().currentContextSizeValue.value).toBe(8192);
  });

  it('flips scroll mode between carousel and native', () => {
    setup().toggleScrollMode();
    expect(state.setConversationScrollMode).toHaveBeenCalledWith(
      'conv-1',
      'native',
    );

    state.getConversationScrollMode.mockReturnValue('native');
    setup().toggleScrollMode();
    expect(state.setConversationScrollMode).toHaveBeenCalledWith(
      'conv-1',
      'carousel',
    );
  });

  it('localizes the scroll-mode title', () => {
    const { scrollModeTitle } = setup();
    expect(scrollModeTitle.value).toBe('common.scrollModeCarousel');

    state.getConversationScrollMode.mockReturnValue('native');
    expect(setup().scrollModeTitle.value).toBe('common.scrollModeNative');
  });

  it('reads the source and view menu collapse/always-show state', () => {
    state.sourceMenuCollapsed = true;
    state.viewMenuAlwaysShow = true;

    const {
      sourceMenuCollapsed,
      viewMenuCollapsed,
      sourceMenuAlwaysShow,
      viewMenuAlwaysShow,
    } = setup();

    expect(sourceMenuCollapsed.value).toBe(true);
    expect(viewMenuCollapsed.value).toBe(false);
    expect(sourceMenuAlwaysShow.value).toBe(false);
    expect(viewMenuAlwaysShow.value).toBe(true);
  });

  it('toggles the source and view menus to the opposite collapse state', () => {
    setup().toggleSourceMenuCollapsed();
    expect(state.setSourceMenuCollapsed).toHaveBeenCalledWith(
      'conv-1',
      'sources',
      true,
    );

    state.sourceMenuCollapsed = true;
    setup().toggleSourceMenuCollapsed();
    expect(state.setSourceMenuCollapsed).toHaveBeenCalledWith(
      'conv-1',
      'sources',
      false,
    );

    setup().toggleViewMenuCollapsed();
    expect(state.setSourceMenuCollapsed).toHaveBeenCalledWith(
      'conv-1',
      'view',
      true,
    );
  });

  it('derives one section toggle per response section with hide labels', () => {
    const { sectionToggles } = setup();

    expect(sectionToggles.value).toEqual([
      {
        key: 'sources',
        icon: Link,
        hidden: false,
        title: 'common.hideSectionWithName[common.sources]',
      },
      {
        key: 'keyFindings',
        icon: Key,
        hidden: false,
        title: 'common.hideSectionWithName[common.keyFindings]',
      },
      {
        key: 'internationalCoverage',
        icon: Languages,
        hidden: false,
        title: 'common.hideSectionWithName[common.internationalCoverage]',
      },
    ]);
  });

  it('switches the section toggle to a show label when hidden', () => {
    state.collapsedSections.sources = true;

    const { sectionToggles } = setup();
    expect(sectionToggles.value[0]).toEqual({
      key: 'sources',
      icon: Link,
      hidden: true,
      title: 'common.showSectionWithName[common.sources]',
    });
  });

  it('derives gallery/list switch labels from the media presentation', () => {
    const { presentationToggles } = setup();

    expect(presentationToggles.value).toEqual([
      {
        key: 'gallery',
        media: 'image',
        icon: Images,
        presentation: 'gallery',
        title: 'common.switchToImageList',
      },
      {
        key: 'videoGallery',
        media: 'video',
        icon: Clapperboard,
        presentation: 'gallery',
        title: 'common.switchToVideoList',
      },
    ]);

    state.mediaPresentations.image = 'list';
    expect(setup().presentationToggles.value[0].title).toBe(
      'common.switchToImageGallery',
    );
  });

  it('maps search sources into tags, falling back for unknown keys', () => {
    refs.searchSources.value = [
      { key: 'web', enabled: true },
      { key: 'images', enabled: false },
      { key: 'unknown', enabled: true },
    ];

    expect(setup().sourceTags.value).toEqual([
      {
        key: 'web',
        enabled: true,
        icon: Globe,
        title: 'common.sourceEnabled[web]',
      },
      {
        key: 'images',
        enabled: false,
        icon: Image,
        title: 'common.sourceDisabled[images]',
      },
      {
        key: 'unknown',
        enabled: true,
        icon: Search,
        title: 'common.sourceEnabled[unknown]',
      },
    ]);
  });

  it('shows the prompt-actions indicator whenever the engine state is known', () => {
    expect(setup().actionsClass.value).toEqual({
      'prompt-actions': true,
      'prompt-actions--with-indicator': true,
    });

    refs.searchEngineState.value = 'unknown';
    expect(setup().actionsClass.value).toEqual({
      'prompt-actions': true,
      'prompt-actions--with-indicator': false,
    });
  });

  it('localizes the engine, EODHD, and file-select titles', () => {
    const {
      searchEngineToggleTitle,
      eodhdToggleTitle,
      noSearchEngineTitle,
      fileSelectTitle,
    } = setup();

    expect(searchEngineToggleTitle.value).toBe('common.searchEngineConnected');
    expect(eodhdToggleTitle.value).toBe('common.eodhdDisabled');
    expect(noSearchEngineTitle.value).toBe(
      'common.noSearchEngineConnectedDesc',
    );
    expect(fileSelectTitle.value).toBe('common.selectFiles');

    refs.selectedModelObj.value = { capabilities: [] };
    expect(setup().fileSelectTitle.value).toBe('common.fileSelectNoImages');

    refs.eodhdState.value = { enabled: true, available: true };
    expect(setup().eodhdToggleTitle.value).toBe('common.eodhdEnabled');
  });

  it('refreshes the model catalog silently on prompt focus', () => {
    setup().onPromptFocus();
    expect(state.fetchModels).toHaveBeenCalledWith({ silent: true });
  });
});
