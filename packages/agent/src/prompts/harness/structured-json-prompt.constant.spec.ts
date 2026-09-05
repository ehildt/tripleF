import { describe, expect, it } from 'vitest';

import { buildIntentCorrectionPrompt } from './structured-json-prompt.constant.js';

describe('buildIntentCorrectionPrompt', () => {
  it('keeps the plan rule but drops the hardcoded JSON template', () => {
    const prompt = buildIntentCorrectionPrompt('boom');

    expect(prompt).toContain('plan');
    expect(prompt).toContain('never null, never a string');
    // No hand-written template fragments with placeholder ellipses.
    expect(prompt).not.toContain('{"images"');
    expect(prompt).not.toContain('[...]');
    expect(prompt).not.toContain('...');
  });
});
