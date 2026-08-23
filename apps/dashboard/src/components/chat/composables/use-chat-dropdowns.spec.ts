import { describe, expect, it, vi } from 'vitest';

import {
  type DropdownRef,
  type SetDropdownRef,
  useChatDropdowns,
} from './use-chat-dropdowns';

function mockDropdown(): DropdownRef {
  return { close: vi.fn() };
}

describe('useChatDropdowns', () => {
  it('closes the context dropdown when think opens', () => {
    const { setThinkDropdownRef, setContextSizeDropdownRef, onThinkOpen } =
      useChatDropdowns();
    const think = mockDropdown();
    const context = mockDropdown();

    setThinkDropdownRef(think as unknown as Parameters<SetDropdownRef>[0]);
    setContextSizeDropdownRef(
      context as unknown as Parameters<SetDropdownRef>[0],
    );

    onThinkOpen();

    expect(context.close).toHaveBeenCalled();
  });

  it('closes the think dropdown when context size opens', () => {
    const {
      setThinkDropdownRef,
      setContextSizeDropdownRef,
      onContextSizeOpen,
    } = useChatDropdowns();
    const think = mockDropdown();
    const context = mockDropdown();

    setThinkDropdownRef(think as unknown as Parameters<SetDropdownRef>[0]);
    setContextSizeDropdownRef(
      context as unknown as Parameters<SetDropdownRef>[0],
    );

    onContextSizeOpen();

    expect(think.close).toHaveBeenCalled();
  });

  it('sets dropdown refs through setter functions', () => {
    const { setThinkDropdownRef } = useChatDropdowns();
    const think = mockDropdown();

    setThinkDropdownRef(think as unknown as Parameters<SetDropdownRef>[0]);

    expect(think.close).not.toHaveBeenCalled();
  });
});
