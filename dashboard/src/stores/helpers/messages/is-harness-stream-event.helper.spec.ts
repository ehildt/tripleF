import { describe, expect, it } from 'vitest';

import type { MessageData } from '../../../types/message-data.model';
import { isHarnessStreamEvent } from './is-harness-stream-event.helper';

describe('isHarnessStreamEvent', () => {
  it('is true when template and delta are present', () => {
    expect(
      isHarnessStreamEvent({ template: 'product', delta: '{}' } as MessageData),
    ).toBe(true);
  });

  it('is false when neither delta, chartData, nor done is present', () => {
    expect(isHarnessStreamEvent({ template: 'product' } as MessageData)).toBe(
      false,
    );
    expect(isHarnessStreamEvent({ delta: '{}' } as MessageData)).toBe(false);
    expect(isHarnessStreamEvent({} as MessageData)).toBe(false);
  });

  it('does not swallow reasoning-delta events (done:false, no delta)', () => {
    // These carry template + done:false and must NOT be routed to the harness
    // stream handler, or the thinking would never reach handleReasoningDelta.
    expect(
      isHarnessStreamEvent({
        template: 'stockmarketitem',
        reasoningDelta: 'step 1…',
        done: false,
      } as MessageData),
    ).toBe(false);
  });

  it('routes chart-series and done payloads (template without a text delta)', () => {
    expect(
      isHarnessStreamEvent({
        template: 'stockmarketitem',
        chartData: { toolName: 'eodhdHistory', data: {} },
      } as MessageData),
    ).toBe(true);
    expect(
      isHarnessStreamEvent({
        template: 'stockmarketitem',
        done: true,
        data: {},
      } as MessageData),
    ).toBe(true);
  });
});
