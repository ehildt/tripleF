import { getApiUrl } from '@/api/api-url';

export interface ConvertedPageImage {
  name: string;
  hash: string;
  /** 1-based page number within the source document. */
  page: number;
}

export interface ConvertedDocument {
  name: string;
  hash: string;
  type: string;
  kind: 'pdf' | 'docx' | 'pptx' | 'text';
  /** Rendered page images (pdf only). */
  pageImages?: ConvertedPageImage[];
}

/**
 * Upload originals to the select-time conversion endpoint: the server
 * stores them (and the rendered page images / extraction manifest) in
 * MinIO and returns per-file references the client renders as tiles.
 */
export async function convertDocuments(
  sessionId: string,
  conversationId: string,
  files: Array<{ file: File; hash: string }>,
): Promise<ConvertedDocument[]> {
  const formData = new FormData();
  for (const { file } of files) {
    formData.append('originals', file, file.name);
  }
  formData.append('hashes', JSON.stringify(files.map((f) => f.hash)));

  const params = new URLSearchParams({ sessionId, conversationId });
  const response = await fetch(
    getApiUrl(`/api/v1/harness/documents?${params.toString()}`),
    {
      method: 'POST',
      body: formData,
    },
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const payload = (await response.json()) as {
    documents: ConvertedDocument[];
  };
  return payload.documents;
}
