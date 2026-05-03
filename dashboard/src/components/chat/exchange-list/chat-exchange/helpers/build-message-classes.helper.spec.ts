import { describe, expect, it } from 'vitest';

import { buildMessageClasses } from './build-message-classes.helper';

describe('buildMessageClasses', () => {
  it('uses accent right-aligned classes for user role', () => {
    const result = buildMessageClasses({
      isUser: true,
      isError: false,
      isHighlighted: false,
    });
    expect(result).toContain('bg-accent-primary/10');
    expect(result).toContain('text-right');
  });

  it('uses error classes for error status', () => {
    const result = buildMessageClasses({
      isUser: false,
      isError: true,
      isHighlighted: false,
    });
    expect(result).toContain('bg-status-error/5');
    expect(result).toContain('text-status-error');
  });

  it('uses neutral classes for assistant non-error', () => {
    const result = buildMessageClasses({
      isUser: false,
      isError: false,
      isHighlighted: false,
    });
    expect(result).toContain('bg-tertiary');
    expect(result).toContain('text-left');
  });

  it('appends highlight class when highlighted', () => {
    const result = buildMessageClasses({
      isUser: false,
      isError: false,
      isHighlighted: true,
    });
    expect(result).toContain('exchange-content__message--highlighted');
    expect(result).not.toContain('animate-pulse');
    expect(result).not.toContain('ring-2');
  });

  it('always includes the content-body class', () => {
    const result = buildMessageClasses({
      isUser: true,
      isError: true,
      isHighlighted: true,
    });
    expect(result).toContain('content-body');
  });

  it('user role takes precedence over error', () => {
    const result = buildMessageClasses({
      isUser: true,
      isError: true,
      isHighlighted: false,
    });
    expect(result).toContain('bg-accent-primary/10');
    expect(result).not.toContain('bg-status-error/5');
  });
});
