import { describe, expect, it } from 'vitest';

import type { HarnessContext } from '../../services/harness-context.type.js';

import { buildFinalMessagesForSanitize } from './build-final-messages.helper.js';

/**
 * Pins the cognition system blocks: content and order matter — the model
 * reads these verbatim. Empty tool results short-circuit to the context
 * system messages + conversation, isolating the cognition rendering.
 */
function buildWithCognition(cognition: {
  profile?: string;
  persona?: string;
  corrections?: string;
  insights?: string[];
  convictions?: string[];
  episodes?: string[];
  clusters?: string[];
}) {
  const ctx = { request: { messages: [] } } as HarnessContext;
  return buildFinalMessagesForSanitize(
    ctx,
    [],
    [],
    [],
    [],
    [],
    [],
    undefined,
    [],
    [],
    [],
    [],
    [],
    [],
    cognition.profile,
    cognition.persona,
    cognition.corrections,
    cognition.insights,
    cognition.convictions,
    cognition.episodes,
    cognition.clusters,
  );
}

/** The bracketed tag of each rendered system message. */
function tags(messages: Array<{ content: unknown }>): string[] {
  return messages.map((m) => String(m.content).match(/^\[[^\]]+\]/)?.[0]);
}

describe('buildFinalMessagesForSanitize cognition context', () => {
  it('renders no cognition blocks when the cognition space is empty', () => {
    expect(buildWithCognition({})).toHaveLength(0);
  });

  it('renders every populated cognition lane in order', () => {
    const messages = buildWithCognition({
      persona: 'You are F.',
      corrections: 'Never use emojis.',
      profile: '{"likes":["cars"]}',
      insights: ['likes vintage cars'],
      convictions: ['the user collects cars'],
      episodes: ['discussed engine swaps'],
      clusters: ['cars cluster overview'],
    });

    expect(tags(messages)).toEqual([
      '[YOUR IDENTITY — WHO YOU ARE TO THIS USER]',
      '[YOUR LEARNED RULES — CORRECTIONS THE USER TAUGHT YOU]',
      '[YOUR PROFILE OF THIS USER — YOUR DERIVED UNDERSTANDING; INFORMS, NEVER QUOTES]',
      '[RELEVANT PRIVATE COGNITION — DERIVED, NEVER VERBATIM]',
      '[YOUR CONVICTIONS — SYNTHESIZED, HOLD LOOSELY]',
      '[RECENT CONVERSATIONS — YOUR SHORT-TERM MEMORY OF PAST TURNS]',
      "[TOPIC CONTEXT — CLUSTERS OF THIS USER'S MEMORY]",
    ]);
    // Every message is a system block.
    expect(messages.every((m) => m.role === 'system')).toBe(true);
  });

  it('renders the profile content without quoting it verbatim', () => {
    const messages = buildWithCognition({ profile: '{"likes":["cars"]}' });

    expect(messages).toHaveLength(1);
    expect(String(messages[0].content)).toContain('{"likes":["cars"]}');
    // The framing guards verbatim quoting: "INFORMS, NEVER QUOTES".
    expect(String(messages[0].content)).toContain('NEVER QUOTES');
  });

  it('renders only the populated lanes (persona only)', () => {
    const messages = buildWithCognition({ persona: 'You are F.' });

    expect(tags(messages)).toEqual([
      '[YOUR IDENTITY — WHO YOU ARE TO THIS USER]',
    ]);
    expect(String(messages[0].content)).toContain('You are F.');
  });

  it('skips blank-string lanes (whitespace-only persona is dropped)', () => {
    const messages = buildWithCognition({ persona: '   ', insights: ['x'] });

    expect(tags(messages)).toEqual([
      '[RELEVANT PRIVATE COGNITION — DERIVED, NEVER VERBATIM]',
    ]);
  });
});
