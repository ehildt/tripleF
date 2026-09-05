import { describe, expect, it } from 'vitest';

import { MEMORY_PROFILE_INSTRUCTIONS } from './memory-profile-prompt.constant.js';

describe('MEMORY_PROFILE_INSTRUCTIONS', () => {
  it('declares the cognition tier the exclusive store for subjective user data', () => {
    expect(MEMORY_PROFILE_INSTRUCTIONS).toContain('Exclusive home of the subjective');
    expect(MEMORY_PROFILE_INSTRUCTIONS).toContain('the ONLY store for user profile data');
  });

  it('keeps objective facts out of the cognition tier', () => {
    expect(MEMORY_PROFILE_INSTRUCTIONS).toContain('never the objective fact store');
    expect(MEMORY_PROFILE_INSTRUCTIONS).toContain(
      'objective records belong to the memory partition, never to this profile',
    );
  });

  it('captures stated preferences instead of skipping them as partition facts', () => {
    expect(MEMORY_PROFILE_INSTRUCTIONS).toContain('stated preferences and interests');
    expect(MEMORY_PROFILE_INSTRUCTIONS).toContain('a preference you do not record is lost');
  });
});
