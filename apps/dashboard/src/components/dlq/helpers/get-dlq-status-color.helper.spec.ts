import { describe, expect, it } from 'vitest';

import type { DlqStatus } from '../../../types/dlq-status.model';
import { getDlqStatusColor } from './get-dlq-status-color.helper';

describe('getDlqStatusColor', () => {
  it('returns a non-empty class string for every known status', () => {
    const statuses: DlqStatus[] = ['Failed', 'Active', 'Cleared', 'Removed'];
    for (const status of statuses) {
      expect(getDlqStatusColor(status)).toBeTruthy();
    }
  });

  it('returns a default style for unknown statuses', () => {
    expect(getDlqStatusColor('UNKNOWN' as DlqStatus)).toBe(
      'dlq-status-badge--unknown',
    );
  });

  it('returns the active modifier for Active entries', () => {
    expect(getDlqStatusColor('Active')).toBe('dlq-status-badge--active');
  });
});
