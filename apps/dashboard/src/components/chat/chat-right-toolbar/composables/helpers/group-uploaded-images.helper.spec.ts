import { describe, expect, it } from 'vitest';

import type { UploadedImage } from '@/stores/conversation';

import { groupUploadedImages } from './group-uploaded-images.helper';

function page(
  hash: string,
  page: number,
  parentHash: string,
  selected = true,
): UploadedImage {
  return {
    name: `doc.pdf · page ${page}`,
    hash,
    page,
    parentHash,
    parentName: 'doc.pdf',
    uploadedAt: 0,
    selected,
    conversationId: 'c1',
  };
}

describe('groupUploadedImages', () => {
  it('groups page images by parent hash and orders them by page number', () => {
    const items = groupUploadedImages([
      page('p3', 3, 'doc'),
      page('p1', 1, 'doc'),
      page('p2', 2, 'doc'),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'gallery' });
    const group = items[0].kind === 'gallery' ? items[0].group : null;
    expect(group).toMatchObject({
      parentHash: 'doc',
      parentName: 'doc.pdf',
      isSelected: true,
    });
    expect(group?.pages.map((p) => p.hash)).toEqual(['p1', 'p2', 'p3']);
  });

  it('interleaves galleries and standalone images in insertion order', () => {
    const items = groupUploadedImages([
      { name: 'cat.png', hash: 'img1', uploadedAt: 0, conversationId: 'c1' },
      page('p1', 1, 'doc'),
      { name: 'dog.png', hash: 'img2', uploadedAt: 0, conversationId: 'c1' },
      page('p2', 2, 'doc'),
    ]);

    expect(
      items.map((i) => (i.kind === 'gallery' ? 'gallery' : i.image.hash)),
    ).toEqual(['img1', 'gallery', 'img2']);
  });

  it('creates one gallery per pdf', () => {
    const items = groupUploadedImages([
      page('a1', 1, 'a'),
      page('b1', 1, 'b'),
      page('a2', 2, 'a'),
    ]);

    expect(items).toHaveLength(2);
    expect(
      items.map((i) => (i.kind === 'gallery' ? i.group.parentHash : '')),
    ).toEqual(['a', 'b']);
  });

  it('marks a group unselected when any page is deselected', () => {
    const items = groupUploadedImages([
      page('p1', 1, 'doc'),
      page('p2', 2, 'doc', false),
    ]);

    const group = items[0].kind === 'gallery' ? items[0].group : null;
    expect(group?.isSelected).toBe(false);
  });

  it('returns standalone items when no image carries a parent hash', () => {
    const items = groupUploadedImages([
      { name: 'cat.png', hash: 'img1', uploadedAt: 0, conversationId: 'c1' },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'standalone' });
  });
});
