import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@/stores/app';

import ChatPromptActionBar from './ChatPromptActionBar.vue';

let activePinia: ReturnType<typeof createPinia>;

function mountComponent(props = {}) {
  return mount(ChatPromptActionBar, {
    props: {
      conversationId: '',
      value: '',
      thinkOptions: ['off', 'medium'],
      thinkValue: 'medium',
      contextSizeOptions: ['4096'],
      contextSizeValue: '4096',
      defaultContextSize: '4096',
      formatContextSize: (value: string) => value,
      isDisabled: false,
      isFileSelectDisabled: false,
      fileSelectDisabledReason: undefined,
      setActionBarRef: vi.fn(),
      setThinkDropdownRef: vi.fn(),
      setContextSizeDropdownRef: vi.fn(),
      ...props,
    },
    global: { plugins: [activePinia] },
  });
}

describe('ChatPromptActionBar', () => {
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
    localStorage.clear();
  });
  it('renders a textarea', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('reflects the value prop on the textarea', () => {
    const wrapper = mountComponent({ value: 'hello' });
    const textarea = wrapper.find('textarea');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('hello');
  });

  it('emits input on textarea input', async () => {
    const wrapper = mountComponent();
    const textarea = wrapper.find('textarea');
    await textarea.setValue('hello');
    expect(wrapper.emitted('input')).toBeTruthy();
  });

  it('emits keydown on textarea keydown', async () => {
    const wrapper = mountComponent();
    const textarea = wrapper.find('textarea');
    await textarea.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('keydown')).toBeTruthy();
  });

  it('emits fileSelect when the file button is clicked', async () => {
    const wrapper = mountComponent();
    await wrapper.find('button[aria-label="Select files"]').trigger('click');
    expect(wrapper.emitted('fileSelect')).toBeTruthy();
  });

  it('disables the file button when isFileSelectDisabled is true', () => {
    const wrapper = mountComponent({ isFileSelectDisabled: true });
    const button = wrapper.find('button[aria-label="Select files"]');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('shows a custom title when fileSelectDisabledReason is provided', () => {
    const wrapper = mountComponent({
      isFileSelectDisabled: true,
      fileSelectDisabledReason: 'No vision support',
    });
    const button = wrapper.findAll('button').at(-1);
    expect(button.attributes('aria-label')).toBe('No vision support');
  });

  it('emits disabledHoverStart and disabledHoverEnd when file select is disabled', async () => {
    const wrapper = mountComponent({ isFileSelectDisabled: true });
    const button = wrapper.find('button[aria-label="Select files"]');

    button.element.dispatchEvent(new MouseEvent('mouseenter'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('disabledHoverStart')).toBeTruthy();

    button.element.dispatchEvent(new MouseEvent('mouseleave'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('disabledHoverEnd')).toBeTruthy();
  });

  it('hides the search engine indicator by default', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.prompt-actions__offline-indicator').exists()).toBe(
      false,
    );
    expect(wrapper.find('.prompt-actions__search-toggle').exists()).toBe(false);
  });

  it('shows the non-interactive globe-off indicator when no search engine is configured', () => {
    const wrapper = mountComponent({ searchEngineState: 'unavailable' });
    const indicator = wrapper.find('.prompt-actions__offline-indicator');
    expect(indicator.exists()).toBe(true);
    expect(indicator.attributes('aria-label')).toContain('No search engine');
    expect(indicator.attributes('aria-label')).toBe(
      'No search engine connected',
    );
    expect(indicator.element.tagName).toBe('SPAN');
  });

  it('shows a globe toggle when the search engine is enabled and emits on click', async () => {
    const wrapper = mountComponent({ searchEngineState: 'enabled' });
    const toggle = wrapper.find(
      '.prompt-actions button[aria-label^="Web search"]',
    );
    expect(toggle.exists()).toBe(true);
    expect(toggle.attributes('aria-label')).toContain('Web search on');
    // Regression: the enabled-state Globe icon must render as a real SVG, not
    // an unresolved native <globe> element (missing import made it invisible).
    const globeIcon = toggle.find('svg.lucide-globe');
    expect(globeIcon.exists()).toBe(true);

    await toggle.trigger('click');
    expect(wrapper.emitted('toggleSearchEngine')).toBeTruthy();
  });

  it('shows a globe-off toggle when the search engine is disabled and emits on click', async () => {
    const wrapper = mountComponent({ searchEngineState: 'disabled' });
    const toggle = wrapper.find(
      '.prompt-actions button[aria-label^="Web search"]',
    );
    expect(toggle.exists()).toBe(true);
    expect(toggle.attributes('aria-label')).toContain('Web search off');

    await toggle.trigger('click');
    expect(wrapper.emitted('toggleSearchEngine')).toBeTruthy();
  });

  it('shows all source tags colored by state while a search engine is enabled', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [
        { key: 'web', enabled: true },
        { key: 'news', enabled: false },
      ],
    });
    const sourcesMenu = wrapper.find('.sources-menu');
    const tags = sourcesMenu.findAll('.sources-menu__tag');
    expect(tags.map((tag) => tag.attributes('aria-label'))).toEqual([
      'web source on',
      'news source off',
    ]);
    expect(tags[0].classes()).not.toContain('sources-menu__tag--disabled');
    expect(tags[1].classes()).toContain('sources-menu__tag--disabled');
  });

  it('emits toggleSource when a source tag is clicked', async () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [
        { key: 'web', enabled: true },
        { key: 'news', enabled: false },
      ],
    });
    const sourcesMenu = wrapper.find('.sources-menu');
    const tags = sourcesMenu.findAll('.sources-menu__tag');
    await tags[1].trigger('click');
    expect(wrapper.emitted('toggleSource')).toEqual([['news']]);
  });

  it('hides source tags when the kill switch disables the engine', () => {
    const wrapper = mountComponent({
      searchEngineState: 'disabled',
      searchSources: [{ key: 'web', enabled: true }],
    });
    expect(wrapper.find('.sources-menu').exists()).toBe(false);
  });

  it('hides source tags when no search engine is available', () => {
    const wrapper = mountComponent({
      searchEngineState: 'unavailable',
      searchSources: [{ key: 'web', enabled: true }],
    });
    expect(wrapper.find('.sources-menu').exists()).toBe(false);
  });

  it('falls back to a distinct Search icon for unknown future sources', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [{ key: 'videos', enabled: true }],
    });
    expect(wrapper.find('.sources-menu__tag-icon').exists()).toBe(true);
    expect(
      wrapper.find('.sources-menu__tag').attributes('aria-label'),
    ).toContain('videos source on');
  });

  it('shows a Landmark toggle for EODHD when available and emits toggleEodhd on click', async () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      eodhdState: { available: true, enabled: true },
    });
    const landmark = wrapper.find('.sources-menu__tag');
    expect(landmark.exists()).toBe(true);
    expect(landmark.attributes('aria-label')).toContain(
      'EODHD stock market on',
    );
    expect(landmark.attributes('aria-pressed')).toBe('true');
    expect(landmark.classes()).not.toContain('sources-menu__tag--disabled');

    await landmark.trigger('click');
    expect(wrapper.emitted('toggleEodhd')).toBeTruthy();
  });

  it('keeps the EODHD Landmark visible but grayed when the engine is off', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      eodhdState: { available: true, enabled: false },
    });
    const landmark = wrapper.find('.sources-menu__tag');
    expect(landmark.exists()).toBe(true);
    expect(landmark.attributes('aria-label')).toContain(
      'EODHD stock market off',
    );
    expect(landmark.attributes('aria-pressed')).toBe('false');
    expect(landmark.classes()).toContain('sources-menu__tag--disabled');
  });

  it('hides the EODHD Landmark toggle when EODHD is not available', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      eodhdState: { available: false, enabled: false },
    });
    expect(wrapper.find('.sources-menu').exists()).toBe(false);
  });

  it('shows the section collapse toggles without an active conversation', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[aria-label="Switch to image list"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[aria-label="Hide Key findings"]').exists()).toBe(
      true,
    );
  });

  it('toggles the conversation scroll mode between carousel and native', async () => {
    const appStore = useAppStore();
    const wrapper = mountComponent({ conversationId: 'conv-1' });

    expect(appStore.getConversationScrollMode('conv-1')).toBe('carousel');

    await wrapper.find('[aria-label="Carousel scroll"]').trigger('click');

    expect(appStore.getConversationScrollMode('conv-1')).toBe('native');
    expect(wrapper.find('[aria-label="Native scroll"]').exists()).toBe(true);
  });

  it('places the view menu after the sources menu', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [{ key: 'web', enabled: true }],
    });
    const strip = wrapper.find('.source-tags-strip');
    const menus = strip.findAll(':scope > *');
    expect(menus[0].classes()).toContain('sources-menu');
    expect(menus[1].classes()).toContain('view-menu');
    const labels = strip
      .findAll('button')
      .map((button) => button.attributes('aria-label'));
    expect(labels).toEqual([
      'web source on',
      'Carousel scroll',
      'Switch to image list',
      'Switch to video gallery',
      'Hide Sources',
      'Hide Key findings',
      'Hide International coverage',
    ]);
  });

  it('shows no collapse arrows while the menus always show', () => {
    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [{ key: 'web', enabled: true }],
    });
    expect(wrapper.find('[aria-label="Collapse section"]').exists()).toBe(
      false,
    );
  });

  it('shows a collapse arrow when the menu is collapsible', () => {
    const appStore = useAppStore();
    appStore.setSourceTagsMenuAlwaysShow('sources', false);

    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [{ key: 'web', enabled: true }],
    });
    const sourcesMenu = wrapper.find('.sources-menu');
    expect(sourcesMenu.find('[aria-label="Collapse section"]').exists()).toBe(
      true,
    );
  });

  it('collapses the sources menu to an expand arrow', async () => {
    const appStore = useAppStore();
    appStore.setSourceTagsMenuAlwaysShow('sources', false);

    const wrapper = mountComponent({
      searchEngineState: 'enabled',
      searchSources: [{ key: 'web', enabled: true }],
    });
    const sourcesMenu = wrapper.find('.sources-menu');
    expect(sourcesMenu.find('[aria-label="web source on"]').exists()).toBe(
      true,
    );

    await sourcesMenu.find('[aria-label="Collapse section"]').trigger('click');

    expect(sourcesMenu.find('[aria-label="web source on"]').exists()).toBe(
      false,
    );
    expect(sourcesMenu.find('[aria-label="Expand section"]').exists()).toBe(
      true,
    );
  });

  it('remembers a collapsed menu across mounts', () => {
    const appStore = useAppStore();
    appStore.setSourceTagsMenuAlwaysShow('view', false);
    appStore.setSourceTagsMenuCollapsed('view', true);

    const wrapper = mountComponent();
    const viewMenu = wrapper.find('.view-menu');
    expect(viewMenu.find('[aria-label="Switch to image list"]').exists()).toBe(
      false,
    );
    expect(viewMenu.find('[aria-label="Expand section"]').exists()).toBe(true);
  });

  it('toggles a response section from the blue menu', async () => {
    const appStore = useAppStore();
    const wrapper = mountComponent();

    expect(appStore.collapsedSections.sources).toBe(false);
    const sourcesToggle = wrapper.find('[aria-label="Hide Sources"]');
    expect(sourcesToggle.exists()).toBe(true);
    expect(sourcesToggle.attributes('aria-pressed')).toBe('true');

    await sourcesToggle.trigger('click');

    expect(appStore.collapsedSections.sources).toBe(true);
    expect(wrapper.find('[aria-label="Show Sources"]').exists()).toBe(true);
  });

  it('switches a media presentation from the blue menu', async () => {
    const appStore = useAppStore();
    const wrapper = mountComponent();

    expect(appStore.mediaPresentations.image).toBe('gallery');
    const galleryToggle = wrapper.find('[aria-label="Switch to image list"]');
    expect(galleryToggle.exists()).toBe(true);
    expect(galleryToggle.attributes('aria-pressed')).toBe('true');

    await galleryToggle.trigger('click');

    expect(appStore.mediaPresentations.image).toBe('list');
    expect(
      wrapper.find('[aria-label="Switch to image gallery"]').exists(),
    ).toBe(true);
  });

  it('reflects a media presentation in the blue menu', () => {
    const appStore = useAppStore();
    appStore.setMediaPresentation('image', 'list');

    const wrapper = mountComponent();
    const galleryToggle = wrapper.find(
      '[aria-label="Switch to image gallery"]',
    );
    expect(galleryToggle.exists()).toBe(true);
    expect(galleryToggle.attributes('aria-pressed')).toBe('false');
  });
});
