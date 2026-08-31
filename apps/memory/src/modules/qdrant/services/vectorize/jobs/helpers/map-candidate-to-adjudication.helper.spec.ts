import { describe, expect, it } from 'vitest';

import { mapCandidateToAdjudication } from './map-candidate-to-adjudication.helper.js';

describe('mapCandidateToAdjudication', () => {
  it('projects a candidate into the adjudication-input shape', () => {
    expect(
      mapCandidateToAdjudication({
        text: 'hello',
        role: 'user',
        createdAt: '2025-01-01',
      }),
    ).toEqual({ text: 'hello', role: 'user', createdAt: '2025-01-01' });
  });
});
