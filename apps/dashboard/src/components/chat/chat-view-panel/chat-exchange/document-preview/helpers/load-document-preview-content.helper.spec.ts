import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadDocumentPreviewContent } from './load-document-preview-content.helper';

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    arrayBuffer: () =>
      Promise.resolve(new TextEncoder().encode('file bytes').buffer),
  } as unknown as Response;
}

function notFoundResponse(): Response {
  return { ok: false, status: 404 } as unknown as Response;
}

describe('loadDocumentPreviewContent', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders docx from the server-built manifest html (sanitized)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        okResponse({ html: '<p>Hello<script>x</script></p>' }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const content = await loadDocumentPreviewContent('/doc/url', 'a.docx');

    expect(fetchMock).toHaveBeenCalledWith('/doc/url.conv');
    expect(content.html).toBe('<p>Hello</p>');
  });

  it('renders pptx as slide text joined with blank lines', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ slides: ['Slide one', 'Slide two'] }));
    vi.stubGlobal('fetch', fetchMock);

    const content = await loadDocumentPreviewContent('/doc/url', 'deck.pptx');

    expect(content.text).toBe('Slide one\n\nSlide two');
  });

  it('throws for docx/pptx when the manifest does not exist', async () => {
    const fetchMock = vi.fn().mockResolvedValue(notFoundResponse());
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      loadDocumentPreviewContent('/doc/url', 'a.docx'),
    ).rejects.toThrow('preview unavailable');
  });

  it('decodes plain text files from the original url', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    const content = await loadDocumentPreviewContent('/doc/url', 'notes.txt');

    expect(fetchMock).toHaveBeenCalledWith('/doc/url');
    expect(content.text).toBe('file bytes');
  });
});
