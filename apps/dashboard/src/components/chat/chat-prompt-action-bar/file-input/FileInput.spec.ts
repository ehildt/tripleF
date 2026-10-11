import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FileInput from './FileInput.vue';

/** Stubs the native readonly `files` property on a file input element. */
function setFiles(input: Element, files: File[] | null) {
  Object.defineProperty(input, 'files', {
    value: files,
    configurable: true,
  });
}

describe('FileInput', () => {
  it('renders a hidden multi-file input with the accept types', () => {
    const wrapper = mount(FileInput, { props: { accept: 'image/*,.pdf' } });

    const input = wrapper.find('input');
    expect(input.attributes('type')).toBe('file');
    expect(input.attributes('name')).toBe('chat-attachments');
    expect(input.attributes('multiple')).toBeDefined();
    expect(input.attributes('accept')).toBe('image/*,.pdf');
  });

  it('emits the picked files on change', async () => {
    const wrapper = mount(FileInput, { props: { accept: '' } });
    const files = [
      new File(['a'], 'a.txt', { type: 'text/plain' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ];

    const input = wrapper.find('input');
    setFiles(input.element, files);
    await input.trigger('change');

    expect(wrapper.emitted('select')).toEqual([[files]]);
  });

  it('emits an empty list when the picker returns no files', async () => {
    const wrapper = mount(FileInput, { props: { accept: '' } });

    const input = wrapper.find('input');
    setFiles(input.element, null);
    await input.trigger('change');

    expect(wrapper.emitted('select')).toEqual([[[]]]);
  });
});
