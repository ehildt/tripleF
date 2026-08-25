import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadDocumentPreviewContent } from '../helpers/load-document-preview-content.helper';
import { useDocumentPreview } from './use-document-preview';

vi.mock('../helpers/load-document-preview-content.helper', () => ({
  loadDocumentPreviewContent: vi.fn(),
}));

const mockedLoadContent = vi.mocked(loadDocumentPreviewContent);

describe('useDocumentPreview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    );
  });

  it('starts closed with no item', () => {
    const preview = useDocumentPreview();
    expect(preview.isOpen.value).toBe(false);
    expect(preview.item.value).toBeNull();
  });

  it('opens with the given document', () => {
    const preview = useDocumentPreview();
    preview.open({ name: 'notes.txt', url: 'blob://notes' });
    expect(preview.isOpen.value).toBe(true);
    expect(preview.item.value).toEqual({
      name: 'notes.txt',
      url: 'blob://notes',
    });
  });

  it('fetches and converts text documents on open', async () => {
    mockedLoadContent.mockResolvedValue({ text: 'hello' });
    const preview = useDocumentPreview();

    preview.open({ name: 'notes.txt', url: 'blob://notes' });
    await flushPromises();

    expect(mockedLoadContent).toHaveBeenCalledWith('blob://notes', 'notes.txt');
    expect(preview.text.value).toBe('hello');
    expect(preview.isLoading.value).toBe(false);
  });

  it('loads preview content for docx-like documents', async () => {
    mockedLoadContent.mockResolvedValue({ html: '<p>Hi</p>' });
    const preview = useDocumentPreview();

    preview.open({ name: 'report.docx', url: 'blob://report' });
    await flushPromises();

    expect(mockedLoadContent).toHaveBeenCalledWith(
      'blob://report',
      'report.docx',
    );
    expect(preview.html.value).toBe('<p>Hi</p>');
    expect(preview.isLoading.value).toBe(false);
  });

  it('surfaces loader errors', async () => {
    mockedLoadContent.mockRejectedValue(new Error('HTTP 404'));
    const preview = useDocumentPreview();

    preview.open({ name: 'notes.txt', url: 'blob://notes' });
    await flushPromises();

    expect(preview.error.value).toContain('404');
  });
});
