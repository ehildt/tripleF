import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import type { SourceListCardProps } from '../SourceListCard.types';
import { useSourceListCard } from './use-source-list-card';

function makeProps(list: readonly string[]): SourceListCardProps {
  return {
    list,
    icon: {} as SourceListCardProps['icon'],
    label: 'Preferred sources',
    description: 'One per line',
    resetTitle: 'Reset',
    placeholder: 'example.com',
  };
}

describe('useSourceListCard', () => {
  it('joins the list into the draft, one entry per line', () => {
    const { draft } = useSourceListCard(makeProps(['a.com', 'b.com']), vi.fn());
    expect(draft.value).toBe('a.com\nb.com');
  });

  it('re-syncs the draft when the list prop changes', async () => {
    const props = reactive(makeProps(['a.com']));
    const { draft } = useSourceListCard(props, vi.fn());

    props.list = ['a.com', 'b.com'];
    await Promise.resolve();
    await Promise.resolve();

    expect(draft.value).toBe('a.com\nb.com');
  });

  it('commits the parsed list on save', () => {
    const emit = vi.fn();
    const { draft, save } = useSourceListCard(makeProps([]), emit);

    draft.value = 'a.com\n\nb.com\na.com';
    save();

    expect(emit).toHaveBeenCalledWith('change', ['a.com', 'b.com']);
  });

  it('resizes the textarea with its content, capped at the max height', () => {
    const { resize } = useSourceListCard(makeProps([]), vi.fn());

    const short = {
      style: { height: '' },
      scrollHeight: 40,
    } as unknown as HTMLTextAreaElement;
    const tall = {
      style: { height: '' },
      scrollHeight: 9999,
    } as unknown as HTMLTextAreaElement;

    resize(short);
    expect(short.style.height).toBe('40px');
    resize(tall);
    expect(tall.style.height).toBe('256px');
  });
});
