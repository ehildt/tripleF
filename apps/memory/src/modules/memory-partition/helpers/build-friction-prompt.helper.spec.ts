import { buildFrictionPrompt } from '@triplef/agent/prompts';
import { describe, expect, it } from 'vitest';

describe('buildFrictionPrompt', () => {
  it('labels the record with its id and text', () => {
    const prompt = buildFrictionPrompt({
      record: { id: 'p1', text: 'User likes dogs' },
      candidates: [],
    });

    expect(prompt).toContain('RECORD (id: p1):');
    expect(prompt).toContain('User likes dogs');
  });

  it('includes the record createdAt when present and omits it when absent', () => {
    const withDate = buildFrictionPrompt({
      record: { id: 'p1', text: 'a', createdAt: '2026-01-01T00:00:00.000Z' },
      candidates: [],
    });
    expect(withDate).toContain('(created: 2026-01-01T00:00:00.000Z)');

    const withoutDate = buildFrictionPrompt({
      record: { id: 'p1', text: 'a' },
      candidates: [],
    });
    expect(withoutDate).not.toContain('(created:');
  });

  it('lists each candidate with id, text, and optional createdAt', () => {
    const prompt = buildFrictionPrompt({
      record: { id: 'p1', text: 'a' },
      candidates: [
        { id: 'p2', text: 'b', createdAt: '2026-01-02T00:00:00.000Z' },
        { id: 'p3', text: 'c' },
      ],
    });

    expect(prompt).toContain('- id: p2');
    expect(prompt).toContain('  text: b');
    expect(prompt).toContain('  created: 2026-01-02T00:00:00.000Z');
    expect(prompt).toContain('- id: p3');
    expect(prompt).toContain('  text: c');
  });

  it('renders (none) for an empty candidate list', () => {
    const prompt = buildFrictionPrompt({
      record: { id: 'p1', text: 'a' },
      candidates: [],
    });

    expect(prompt).toContain('CANDIDATES:');
    expect(prompt).toContain('(none)');
  });
});
