import { LABEL_FONT } from './label-font.constant';

/** Draw one hub/category label next to its dot. */
export function drawNodeLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
  opacity: number,
  offsetX = 8,
): void {
  ctx.fillStyle = color;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.9 * opacity;
  ctx.fillText(label, x + offsetX, y);
  ctx.globalAlpha = 1;
}
