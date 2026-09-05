import { describe, expect, it } from 'vitest';

import type { MemoryCognitionProfile } from './memory-cognition.model.js';
import { pruneProfileTopic } from './prune-profile-topic.helper.js';

describe('pruneProfileTopic', () => {
  it('prunes one value from an array facet, normalized like a probe key', () => {
    const profile: MemoryCognitionProfile = { likes: ['Jazz', 'Linux'], interests: ['retro consoles'] };

    const outcome = pruneProfileTopic(profile, 'likes.jazz');

    expect(outcome.removed).toBe('Jazz');
    expect(outcome.profile.likes).toEqual(['Linux']);
    expect(outcome.profile.interests).toEqual(['retro consoles']);
  });

  it('matches stored values with spaces against a dash-joined path keyword', () => {
    const profile: MemoryCognitionProfile = { interests: ['retro consoles'] };

    const outcome = pruneProfileTopic(profile, 'interests.Retro Consoles');

    expect(outcome.removed).toBe('retro consoles');
    // An emptied facet is removed entirely, never left as an empty list.
    expect(outcome.profile.interests).toBeUndefined();
  });

  it('prunes one key from a record facet (preferences, corrections)', () => {
    const profile: MemoryCognitionProfile = {
      preferences: { editor: 'vim', theme: 'dark' },
      corrections: { 'lint-before-commit': 'always run lint before committing' },
    };

    const outcome = pruneProfileTopic(profile, 'preferences.editor');

    expect(outcome.removed).toBe('editor');
    expect(outcome.profile.preferences).toEqual({ theme: 'dark' });
    expect(outcome.profile.corrections).toEqual({ 'lint-before-commit': 'always run lint before committing' });
  });

  it('returns the same reference when the path matches nothing — callers persist only on a hit', () => {
    const profile: MemoryCognitionProfile = { likes: ['jazz'] };

    expect(pruneProfileTopic(profile, 'likes.metal').profile).toBe(profile);
    expect(pruneProfileTopic(profile, 'dislikes.jazz').profile).toBe(profile);
    expect(pruneProfileTopic(profile, 'no-dot-shape').profile).toBe(profile);
  });

  it('never prunes scalar or nested facets (persona, name, communication)', () => {
    const profile: MemoryCognitionProfile = { name: 'Sam', persona: { name: 'Aria' } };

    expect(pruneProfileTopic(profile, 'name.sam').profile).toBe(profile);
    expect(pruneProfileTopic(profile, 'persona.aria').profile).toBe(profile);
  });
});
