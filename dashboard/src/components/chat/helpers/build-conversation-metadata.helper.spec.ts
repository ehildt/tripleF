import { describe, expect, it } from 'vitest';

import type { UploadedImage } from '@/stores/conversation';

import { buildConversationMetadata } from './build-conversation-metadata.helper';

function makeImage(
  overrides: Partial<UploadedImage> & { hash: string },
): UploadedImage {
  return {
    name: `${overrides.hash}.png`,
    uploadedAt: 1,
    conversationId: 'conv-1',
    ...overrides,
  };
}

describe('buildConversationMetadata', () => {
  it('includes every toolbar-selected reference', () => {
    const result = buildConversationMetadata(
      [makeImage({ hash: 'a' }), makeImage({ hash: 'b' })],
      [],
      'conv-1',
    );

    expect(result.images).toEqual([
      { name: 'a.png', hash: 'a' },
      { name: 'b.png', hash: 'b' },
    ]);
  });

  it('adds still-selected persisted uploads that are not in the selection', () => {
    const result = buildConversationMetadata(
      [makeImage({ hash: 'a' })],
      [makeImage({ hash: 'c', selected: true })],
      'conv-1',
    );

    expect(result.images).toEqual([
      { name: 'a.png', hash: 'a' },
      { name: 'c.png', hash: 'c' },
    ]);
  });

  it('skips persisted uploads already covered by the toolbar selection', () => {
    const result = buildConversationMetadata(
      [makeImage({ hash: 'a' })],
      [makeImage({ hash: 'a', selected: true })],
      'conv-1',
    );

    expect(result.images).toEqual([{ name: 'a.png', hash: 'a' }]);
  });

  it('skips deselected uploads and uploads of other conversations', () => {
    const result = buildConversationMetadata(
      [],
      [
        makeImage({ hash: 'off', selected: false }),
        makeImage({ hash: 'other', conversationId: 'conv-2', selected: true }),
      ],
      'conv-1',
    );

    expect(result.images).toEqual([]);
  });

  it('excludes non-original variants and keeps entries without a variant', () => {
    const result = buildConversationMetadata(
      [
        makeImage({ hash: 'orig' }) as UploadedImage & { variant?: string },
        {
          ...makeImage({ hash: 'thumb' }),
          variant: 'thumb',
        } as unknown as UploadedImage,
      ],
      [],
      'conv-1',
    );

    expect(result.images).toEqual([{ name: 'orig.png', hash: 'orig' }]);
  });
});
