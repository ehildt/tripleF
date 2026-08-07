import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation';

import ExchangeHeader from './ExchangeHeader.vue';

function makeExchange(overrides: Partial<Exchange> = {}): Exchange {
  return {
    id: 'e1',
    role: 'assistant',
    content: '',
    status: 'done',
    timestamp: 0,
    ...overrides,
  } as Exchange;
}

function mountHeader(exchange: Exchange, isUser = false) {
  return mount(ExchangeHeader, {
    global: { plugins: [createPinia()] },
    props: {
      exchange,
      isUser,
      isDone: exchange.status === 'done',
      isError: exchange.status === 'error',
      isPending: exchange.status === 'pending',
      isStreaming: exchange.status === 'streaming',
    },
  });
}

describe('ExchangeHeader meta bar', () => {
  it('renders the meta-bar after the copy action for a done assistant exchange', () => {
    const wrapper = mountHeader(
      makeExchange({
        role: 'assistant',
        status: 'done',
        harnessData: {
          category: 'Tech',
          publishDate: '2026-08-07',
          readTime: '5 min read',
          author: 'Ada',
        },
      }),
    );

    const actions = wrapper.findAll('.header-action');
    const metaBar = wrapper.find('.exchange-header__meta-bar');

    expect(metaBar.exists()).toBe(true);
    expect(metaBar.text()).toContain('Tech');
    expect(metaBar.text()).toContain('2026-08-07');
    expect(metaBar.text()).toContain('5 min read');
    expect(metaBar.text()).toContain('Ada');

    // The meta-bar sits right after the copy action (first action for a done
    // assistant exchange).
    const copy = actions[0];
    expect(copy.attributes('aria-label')).toBe('Copy');
  });

  it('does not render the meta-bar for user exchanges', () => {
    const wrapper = mountHeader(
      makeExchange({
        role: 'user',
        status: 'done',
        content: 'hi',
        harnessData: { category: 'Tech' },
      }),
      true,
    );

    expect(wrapper.find('.exchange-header__meta-bar').exists()).toBe(false);
  });

  it('does not render the meta-bar when there is no meta data', () => {
    const wrapper = mountHeader(
      makeExchange({ role: 'assistant', status: 'done' }),
    );

    expect(wrapper.find('.exchange-header__meta-bar').exists()).toBe(false);
  });

  it('does not render the meta-bar while streaming', () => {
    const wrapper = mountHeader(
      makeExchange({
        role: 'assistant',
        status: 'streaming',
        harnessData: { category: 'Tech' },
      }),
    );

    expect(wrapper.find('.exchange-header__meta-bar').exists()).toBe(false);
  });
});
