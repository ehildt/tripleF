import { describe, expect, it } from 'vitest';

import { mapMarkerToLayout } from './map-marker-to-layout.helper';

describe('mapMarkerToLayout', () => {
  it('projects a marker into the layout input shape', () => {
    const resolveTokenColor = (token: string | undefined, alpha: number) =>
      `${token ?? 'accent'}:${alpha}`;
    expect(
      mapMarkerToLayout(
        {
          time: 't',
          position: 'aboveBar',
          color: 'status-error',
          shape: 'arrowUp',
          text: 'Buy',
        },
        resolveTokenColor,
      ),
    ).toEqual({
      time: 't',
      position: 'aboveBar',
      color: 'status-error:1',
      shape: 'arrowUp',
      text: 'Buy',
    });
  });
});
