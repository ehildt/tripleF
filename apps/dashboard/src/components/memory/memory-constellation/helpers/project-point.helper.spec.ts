import { describe, expect, it } from 'vitest';

import { projectPoint } from './project-point.helper';

describe('projectPoint', () => {
  it('projects the origin onto the view center at scale 1', () => {
    expect(projectPoint({ x: 0, y: 0, z: 0 }, 0, 0, 500, 100, 50, 1)).toEqual({
      x: 100,
      y: 50,
      scale: 1,
    });
  });

  it('scales the offset by zoom and perspective depth', () => {
    const p = projectPoint({ x: 100, y: 0, z: 0 }, 0, 0, 500, 0, 0, 2);

    // x=100 at yaw 0 projects to +100 * scale * zoom.
    expect(p.x).toBeCloseTo(200);
    expect(p.scale).toBeCloseTo(1);
  });

  it('shrinks dots behind the view plane (scale < 1)', () => {
    const p = projectPoint({ x: 0, y: 0, z: 250 }, 0, 0, 500, 0, 0, 1);

    expect(p.scale).toBeCloseTo(500 / 750);
  });

  it('rotates the point around the Y axis with yaw', () => {
    const p = projectPoint(
      { x: 100, y: 0, z: 0 },
      Math.PI / 2,
      0,
      500,
      0,
      0,
      1,
    );

    // Yaw 90° moves the x offset onto the depth axis: screen x → 0.
    expect(p.x).toBeCloseTo(0);
  });
});
