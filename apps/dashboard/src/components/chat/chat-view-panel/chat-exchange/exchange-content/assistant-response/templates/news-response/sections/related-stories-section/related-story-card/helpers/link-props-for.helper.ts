import type { RelatedStory } from '@/types/harness-response-data.model';

export interface RelatedStoryLinkProps {
  is: 'a' | 'div';
  href?: string;
  target?: string;
  rel?: string;
  title?: string;
}

/** Whole-card link when a URL exists; inert wrapper otherwise. */
export function linkPropsFor(story: RelatedStory): RelatedStoryLinkProps {
  if (!story.url) return { is: 'div' };
  return {
    is: 'a',
    href: story.url,
    target: '_blank',
    rel: 'noopener noreferrer',
    title: story.title || story.url,
  };
}
