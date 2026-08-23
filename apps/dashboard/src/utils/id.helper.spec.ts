import { describe, expect, it, vi } from 'vitest';

vi.mock('@paralleldrive/cuid2', () => ({
  init: vi.fn(() => () => 'fixedcuid10'),
}));

const { createId } = await import('@/utils/id.helper');

describe('createId', () => {
  it('returns a string', () => {
    const id = createId();
    expect(typeof id).toBe('string');
  });

  it('returns consistent mock id', () => {
    expect(createId()).toBe('fixedcuid10');
  });
});
