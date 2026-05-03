import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useChatActions } from './use-chat-actions';

describe('useChatActions', () => {
  it('scrolls to the exchange for a clicked prompt index', () => {
    const chatListRef = ref({ scrollToExchange: vi.fn() });
    const userExchanges = ref([{ id: 'ex1', role: 'user', content: 'hi' }]);
    const toolbarRef = ref(null);
    const hasNoModelSelected = ref(false);

    const { onPromptClick } = useChatActions({
      chatListRef,
      userExchanges,
      toolbarRef,
      hasNoModelSelected,
      supportsVision: ref(true),
    });

    onPromptClick(0);

    expect(chatListRef.value.scrollToExchange).toHaveBeenCalledWith('ex1');
  });

  it('does not trigger file select when no model is selected', () => {
    const toolbarRef = ref({
      fileInputRef: { click: vi.fn() },
      removeFile: vi.fn(),
      toggleFileSelected: vi.fn(),
    });
    const hasNoModelSelected = ref(true);

    const { triggerFileSelect } = useChatActions({
      chatListRef: ref(null),
      userExchanges: ref([]),
      toolbarRef,
      hasNoModelSelected,
      supportsVision: ref(true),
    });

    triggerFileSelect();

    expect(toolbarRef.value.fileInputRef.click).not.toHaveBeenCalled();
  });

  it('clicks the toolbar file input when triggering file select', () => {
    const toolbarRef = ref({
      fileInputRef: { click: vi.fn() },
      removeFile: vi.fn(),
      toggleFileSelected: vi.fn(),
    });
    const hasNoModelSelected = ref(false);

    const { triggerFileSelect } = useChatActions({
      chatListRef: ref(null),
      userExchanges: ref([]),
      toolbarRef,
      hasNoModelSelected,
      supportsVision: ref(true),
    });

    triggerFileSelect();

    expect(toolbarRef.value.fileInputRef.click).toHaveBeenCalled();
  });

  it('does not trigger file select when selected model does not support vision', () => {
    const toolbarRef = ref({
      fileInputRef: { click: vi.fn() },
      removeFile: vi.fn(),
      toggleFileSelected: vi.fn(),
    });
    const hasNoModelSelected = ref(false);
    const supportsVision = ref(false);

    const { triggerFileSelect } = useChatActions({
      chatListRef: ref(null),
      userExchanges: ref([]),
      toolbarRef,
      hasNoModelSelected,
      supportsVision,
    });

    triggerFileSelect();

    expect(toolbarRef.value.fileInputRef.click).not.toHaveBeenCalled();
  });

  it('removes the attached file at the given index', () => {
    const toolbarRef = ref({
      fileInputRef: { click: vi.fn() },
      removeFile: vi.fn(),
      toggleFileSelected: vi.fn(),
    });

    const { onRemoveAttachedFile } = useChatActions({
      chatListRef: ref(null),
      userExchanges: ref([]),
      toolbarRef,
      hasNoModelSelected: ref(false),
      supportsVision: ref(true),
    });

    onRemoveAttachedFile(2);

    expect(toolbarRef.value.removeFile).toHaveBeenCalledWith(2);
  });

  it('toggles the attached file selection at the given index', () => {
    const toolbarRef = ref({
      fileInputRef: { click: vi.fn() },
      removeFile: vi.fn(),
      toggleFileSelected: vi.fn(),
    });

    const { onToggleAttachedFileSelected } = useChatActions({
      chatListRef: ref(null),
      userExchanges: ref([]),
      toolbarRef,
      hasNoModelSelected: ref(false),
      supportsVision: ref(true),
    });

    onToggleAttachedFileSelected(3);

    expect(toolbarRef.value.toggleFileSelected).toHaveBeenCalledWith(3);
  });
});
