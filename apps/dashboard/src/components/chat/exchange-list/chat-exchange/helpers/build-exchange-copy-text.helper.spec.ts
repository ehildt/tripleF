import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation';

import { buildExchangeCopyText } from './build-exchange-copy-text.helper';

function makeExchange(overrides: Partial<Exchange>): Exchange {
  return {
    id: 'exchange-1',
    role: 'assistant',
    content: '',
    status: 'done',
    timestamp: 0,
    ...overrides,
  };
}

describe('buildExchangeCopyText', () => {
  it('copies user messages verbatim', () => {
    const exchange = makeExchange({ role: 'user', content: '  my prompt  ' });
    expect(buildExchangeCopyText(exchange)).toBe('  my prompt  ');
  });

  it('copies plain-text assistant responses as they are', () => {
    const exchange = makeExchange({ content: 'Just a chat answer.' });
    expect(buildExchangeCopyText(exchange)).toBe('Just a chat answer.');
  });

  it('formats structured responses instead of copying the fallback title', () => {
    const exchange = makeExchange({
      content: 'Nioh 3 Release Buzz',
      harnessTemplate: 'article',
      harnessData: {
        title: 'Nioh 3 Release Buzz',
        summary: 'Everything about the launch.',
        keyFindings: [{ text: 'Releases February 2026' }],
        conclusion: 'Worth the wait.',
        sources: [{ title: 'IGN', url: 'https://ign.com/nioh3' }],
      },
    });
    const copyText = buildExchangeCopyText(exchange);
    expect(copyText).toContain('Nioh 3 Release Buzz');
    expect(copyText).toContain('Everything about the launch.');
    expect(copyText).toContain('Releases February 2026');
    expect(copyText).toContain('Worth the wait.');
    expect(copyText).toContain('https://ign.com/nioh3');
  });

  it('prefers the response text over templated data when both exist', () => {
    const exchange = makeExchange({
      content: 'Fallback',
      text: 'The streamed answer.',
      harnessTemplate: 'article',
      harnessData: { title: 'Data title' },
    });
    expect(buildExchangeCopyText(exchange)).toBe('The streamed answer.');
  });

  it('recovers structured data from legacy JSON content', () => {
    const exchange = makeExchange({
      content: JSON.stringify({
        title: 'Legacy Article',
        summary: 'Stored before harnessData was tracked.',
      }),
      harnessTemplate: 'article',
    });
    const copyText = buildExchangeCopyText(exchange);
    expect(copyText).toContain('Legacy Article');
    expect(copyText).toContain('Stored before harnessData was tracked.');
  });
});
