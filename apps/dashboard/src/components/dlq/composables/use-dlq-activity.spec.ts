import { beforeEach, describe, expect, it } from 'vitest';

import { useDlqActivity } from './use-dlq-activity';

describe('useDlqActivity', () => {
  beforeEach(() => useDlqActivity().clearDlqActivity());

  it('shares activity controls across callers', () => {
    const navigation = useDlqActivity();
    const dlqView = useDlqActivity();
    expect(navigation.hasDlqActivity.value).toBe(false);

    navigation.markDlqActivity();
    expect(dlqView.hasDlqActivity.value).toBe(true);

    dlqView.clearDlqActivity();
    expect(navigation.hasDlqActivity.value).toBe(false);
  });
});
