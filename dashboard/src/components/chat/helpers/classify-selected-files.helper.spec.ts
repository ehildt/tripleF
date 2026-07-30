import { describe, expect, it, vi } from 'vitest';

import type { UploadedImage } from '@/stores/conversation';
import { hashFile } from '@/utils/hash-file.helper';

import { classifySelectedFiles } from './classify-selected-files.helper';

vi.mock('@/utils/hash-file.helper', () => ({
  hashFile: vi.fn(async (file: File) => `hash-${file.name}`),
}));

function makeUploadedImage(
  hash: string,
  conversationId: string,
): UploadedImage {
  return { name: `${hash}.png`, hash, uploadedAt: 1, conversationId };
}

describe('classifySelectedFiles', () => {
  it('treats every file as new when nothing was uploaded before', async () => {
    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ];

    const result = await classifySelectedFiles(files, [], 'conv-1');

    expect(hashFile).toHaveBeenCalledTimes(2);
    expect(result.newFiles).toHaveLength(2);
    expect(result.referencedImages).toEqual([
      expect.objectContaining({ name: 'a.png', hash: 'hash-a.png' }),
      expect.objectContaining({ name: 'b.png', hash: 'hash-b.png' }),
    ]);
    expect(result.referencedImages[0].conversationId).toBe('conv-1');
    expect(result.referencedImages[0].uploadedAt).toEqual(expect.any(Number));
  });

  it('skips files whose hash is already uploaded for the conversation', async () => {
    const files = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ];

    const result = await classifySelectedFiles(
      files,
      [makeUploadedImage('hash-a.png', 'conv-1')],
      'conv-1',
    );

    expect(result.newFiles).toHaveLength(1);
    expect(result.newFiles[0].name).toBe('b.png');
    expect(result.referencedImages).toHaveLength(2);
  });

  it('ignores images uploaded for a different conversation', async () => {
    const files = [new File(['a'], 'a.png', { type: 'image/png' })];

    const result = await classifySelectedFiles(
      files,
      [makeUploadedImage('hash-a.png', 'other-conv')],
      'conv-1',
    );

    expect(result.newFiles).toHaveLength(1);
  });

  it('handles an empty selection', async () => {
    const result = await classifySelectedFiles([], [], 'conv-1');

    expect(result.newFiles).toEqual([]);
    expect(result.referencedImages).toEqual([]);
  });
});
