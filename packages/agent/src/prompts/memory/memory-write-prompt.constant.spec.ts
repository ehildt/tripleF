import { describe, expect, it } from 'vitest';

import { buildMemoryWritePrompt, MEMORY_WRITE_INSTRUCTIONS } from './memory-write-prompt.constant.js';

describe('MEMORY_WRITE_INSTRUCTIONS', () => {
  it('defines the lanes by subjectivity: partition = objective facts, cognition = subjective user data', () => {
    expect(MEMORY_WRITE_INSTRUCTIONS).toContain('memory-partition = the OBJECTIVE fact store');
    expect(MEMORY_WRITE_INSTRUCTIONS).toContain('memory-cognition = the SUBJECTIVE profile store');
  });

  it('carries the routing constraint that bars preferences from the partition', () => {
    expect(MEMORY_WRITE_INSTRUCTIONS).toContain('ROUTING CONSTRAINT (absolute)');
    expect(MEMORY_WRITE_INSTRUCTIONS).toContain(
      'You MUST NOT store user preferences, behavioral traits, or internal states there',
    );
    expect(MEMORY_WRITE_INSTRUCTIONS).toContain('deferred to the cognition tier');
  });

  it('routes stated preferences to the cognition lane', () => {
    expect(MEMORY_WRITE_INSTRUCTIONS).toContain('stated preferences live HERE, never in the partition');
  });
});

describe('buildMemoryWritePrompt', () => {
  it('assembles the turn payload with the boundary-aware verdict', () => {
    const prompt = buildMemoryWritePrompt({ userRequest: 'what is AMD up to?' });

    expect(prompt).toContain('USER REQUEST: what is AMD up to?');
    expect(prompt).toContain('each durable objective fact with one memory-partition-remember call');
    expect(prompt).toContain('each subjective user datum (stated or derived) with one memory-cognition-remember call');
  });
});
