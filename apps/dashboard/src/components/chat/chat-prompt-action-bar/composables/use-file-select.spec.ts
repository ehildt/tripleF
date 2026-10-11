import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';

import { useFileSelect } from './use-file-select.composable';
import type { FileInputRef, SetFileInputRef } from './use-file-select.types';

const state = vi.hoisted(() => ({
  addFiles: vi.fn(),
  selectedModel: 'gpt-4o',
}));

const refs = vi.hoisted(() => ({})) as {
  conversation: Ref<Record<string, unknown>>;
  selectedModelObj: Ref<{ capabilities?: string[] }>;
};

vi.mock('@/stores/attached-files', () => ({
  useAttachedFilesStore: () => ({ addFiles: state.addFiles }),
}));

vi.mock('@/stores/models', () => ({
  useModelsStore: () => ({
    get selectedModel() {
      return state.selectedModel;
    },
  }),
}));

vi.mock('../../composables/use-chat-conversation', async () => {
  const { ref } = await import('vue');
  refs.conversation = ref<Record<string, unknown>>({});
  refs.selectedModelObj = ref<{ capabilities?: string[] }>({
    capabilities: ['vision'],
  });
  return {
    useChatConversation: () => ({
      conversation: refs.conversation,
      selectedModelObj: refs.selectedModelObj,
    }),
  };
});

/** Builds a handle shaped like FileInput's exposed instance with a spy click. */
function mockFileInputRef(): FileInputRef {
  const click = vi.fn();
  return { inputRef: { click } as unknown as HTMLInputElement };
}

describe('useFileSelect', () => {
  beforeEach(() => {
    state.addFiles.mockClear();
    state.selectedModel = 'gpt-4o';
    refs.conversation.value = {};
    refs.selectedModelObj.value = { capabilities: ['vision'] };
  });

  it('clicks the exposed input when not disabled', () => {
    const { setFileInputRef, triggerFileSelect } = useFileSelect();
    const handle = mockFileInputRef();

    setFileInputRef(handle as unknown as Parameters<SetFileInputRef>[0]);

    triggerFileSelect();

    expect(handle.inputRef?.click).toHaveBeenCalledTimes(1);
  });

  it('does not click the input when disabled', () => {
    refs.selectedModelObj.value = { capabilities: [] };
    const { setFileInputRef, triggerFileSelect } = useFileSelect();
    const handle = mockFileInputRef();

    setFileInputRef(handle as unknown as Parameters<SetFileInputRef>[0]);

    triggerFileSelect();

    expect(handle.inputRef?.click).not.toHaveBeenCalled();
  });

  it('feeds the picked files to the attached-files store', () => {
    const { onFilesSelect } = useFileSelect();
    const files = [new File(['x'], 'x.txt')];

    onFilesSelect(files);

    expect(state.addFiles).toHaveBeenCalledWith(files);
  });

  it('exposes the accepted file types', () => {
    const { acceptedFileTypes } = useFileSelect();

    expect(acceptedFileTypes).toContain('image/*');
  });

  it('derives the disabled gate from the model selection and vision support', () => {
    expect(useFileSelect().isFileSelectDisabled.value).toBe(false);

    refs.selectedModelObj.value = { capabilities: [] };
    expect(useFileSelect().isFileSelectDisabled.value).toBe(true);

    refs.selectedModelObj.value = { capabilities: ['vision'] };
    state.selectedModel = '';
    expect(useFileSelect().isFileSelectDisabled.value).toBe(true);
  });
});
