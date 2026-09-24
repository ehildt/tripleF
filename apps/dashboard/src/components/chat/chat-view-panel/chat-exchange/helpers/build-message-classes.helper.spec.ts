import { describe, expect, it } from 'vitest';

import { buildMessageClasses } from './build-message-classes.helper';

describe('buildMessageClasses', () => {
  it('uses user variant for user role', () => {
    const result = buildMessageClasses({
      isUser: true,
      isError: false,
      isHighlighted: false,
    });
    expect(result).toContain('exchange-message--user');
  });

  it('uses error variant for error status', () => {
    const result = buildMessageClasses({
      isUser: false,
      isError: true,
      isHighlighted: false,
    });
    expect(result).toContain('exchange-message--error');
  });

  it('uses assistant variant for assistant non-error', () => {
    const result = buildMessageClasses({
      isUser: false,
      isError: false,
      isHighlighted: false,
    });
    expect(result).toContain('exchange-message--assistant');
  });

  it('appends highlight modifier when highlighted', () => {
    const result = buildMessageClasses({
      isUser: false,
      isError: false,
      isHighlighted: true,
    });
    expect(result).toContain('exchange-message--highlighted');
  });

  it('always includes the base exchange-message class', () => {
    const result = buildMessageClasses({
      isUser: true,
      isError: true,
      isHighlighted: true,
    });
    expect(result).toContain('exchange-message');
  });

  it('always includes the content-body hook for light-mode overrides', () => {
    const result = buildMessageClasses({
      isUser: false,
      isError: false,
      isHighlighted: false,
    });
    expect(result).toContain('content-body');
  });

  it('user role takes precedence over error', () => {
    const result = buildMessageClasses({
      isUser: true,
      isError: true,
      isHighlighted: false,
    });
    expect(result).toContain('exchange-message--user');
    expect(result).not.toContain('exchange-message--error');
  });
});
