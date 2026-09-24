import type { Exchange } from '@/stores/conversation';

import type { ExchangeSection } from './build-exchange-sections.helper.types';

/**
 * Group a flat exchange list (user, assistant, user, assistant, …) into
 * sections, each holding one user prompt and the assistant response(s) that
 * belong to it. A section starts at every user exchange; every subsequent
 * assistant exchange is appended to the current section until the next user
 * prompt. An orphan assistant with no preceding user becomes its own section.
 */
export function buildExchangeSections(
  exchanges: readonly Exchange[],
): ExchangeSection[] {
  const sections: ExchangeSection[] = [];

  for (const exchange of exchanges) {
    if (exchange.role === 'user') {
      sections.push({ id: exchange.id, user: exchange, assistants: [] });
    } else if (sections.length > 0) {
      sections[sections.length - 1].assistants.push(exchange);
    } else {
      sections.push({
        id: exchange.id,
        user: undefined,
        assistants: [exchange],
      });
    }
  }

  return sections;
}
