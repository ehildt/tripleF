import { describe, expect, it } from 'vitest';

import type { MessageData } from '../../types/message-data.model';
import { isHarnessStreamEvent } from './is-harness-stream-event.helper';

describe('isHarnessStreamEvent', () => {
  it('is true when template and delta are present', () => {
    expect(
      isHarnessStreamEvent({ template: 'product', delta: '{}' } as MessageData),
    ).toBe(true);
  });

  it('is false when either field is missing', () => {
    expect(isHarnessStreamEvent({ template: 'product' } as MessageData)).toBe(
      false,
    );
    expect(isHarnessStreamEvent({ delta: '{}' } as MessageData)).toBe(false);
    expect(isHarnessStreamEvent({} as MessageData)).toBe(false);
  });
});
