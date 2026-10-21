import { describe, expect, it } from 'vitest';

import { parseFailureReason } from './parse-failure-reason.helper';

describe('parseFailureReason', () => {
  it('returns null for a missing or empty reason', () => {
    expect(parseFailureReason(null)).toBeNull();
    expect(parseFailureReason(undefined)).toBeNull();
    expect(parseFailureReason('')).toBeNull();
  });

  it('passes plain-text reasons through without raw detail', () => {
    expect(parseFailureReason('boom')).toEqual({ text: 'boom', raw: null });
  });

  it('extracts the message from a JSON error object', () => {
    const reason = JSON.stringify({ message: 'Validation failed' });
    const result = parseFailureReason(reason);
    expect(result?.text).toBe('Validation failed');
    expect(result?.raw).toBe(
      JSON.stringify({ message: 'Validation failed' }, null, 2),
    );
  });

  it('joins the unique messages of a JSON issue array', () => {
    const reason = JSON.stringify([
      { message: 'too small' },
      { message: 'too small' },
      { message: 'expected string' },
    ]);
    expect(parseFailureReason(reason)?.text).toBe('too small; expected string');
  });

  it('drills into nested error/cause/details objects', () => {
    const reason = JSON.stringify({
      error: { cause: { message: 'root cause text' } },
    });
    expect(parseFailureReason(reason)?.text).toBe('root cause text');
  });

  it('falls back to a placeholder text for complex JSON without a message', () => {
    const reason = JSON.stringify({ code: 42 });
    const result = parseFailureReason(reason);
    expect(result?.text).toBe('Complex failure — see the error tab');
    expect(result?.raw).toContain('"code": 42');
  });

  it('returns broken JSON as plain text', () => {
    const reason = '{"message":';
    expect(parseFailureReason(reason)).toEqual({ text: reason, raw: null });
  });
});
