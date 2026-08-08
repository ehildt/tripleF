import { describe, expect, it } from 'vitest';

import { findAnchorScrollRoot } from './find-anchor-scroll-root.helper';

describe('findAnchorScrollRoot', () => {
  it('returns the closest ancestor marked as playback scroll root', () => {
    const root = document.createElement('div');
    root.dataset.playbackScrollRoot = '';
    const inner = document.createElement('div');
    const child = document.createElement('div');
    document.body.appendChild(root);
    root.appendChild(inner);
    inner.appendChild(child);
    expect(findAnchorScrollRoot(child)).toBe(root);
    root.remove();
  });

  it('returns the nearest marked ancestor, not an outer one', () => {
    const outer = document.createElement('div');
    outer.dataset.playbackScrollRoot = '';
    const inner = document.createElement('div');
    inner.dataset.playbackScrollRoot = '';
    const child = document.createElement('div');
    document.body.appendChild(outer);
    outer.appendChild(inner);
    inner.appendChild(child);
    expect(findAnchorScrollRoot(child)).toBe(inner);
    outer.remove();
  });

  it('returns null without a marked ancestor (viewport scroller)', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    document.body.appendChild(parent);
    parent.appendChild(child);
    expect(findAnchorScrollRoot(child)).toBeNull();
    parent.remove();
  });
});
