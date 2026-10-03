/**
 * Google Images `tbs=isz` size buckets (shared by Serper and Bright Data).
 *
 * Choose the bucket whose threshold is the largest one that is still <= the
 * requested pixel area. `isz:lt,islt:<label>` means "images larger than the
 * bucket's threshold", so using the largest threshold below the target
 * returns the broadest result set that can satisfy the target.
 *
 * Examples:
 * - 1280×720 (0.92 MP) -> xga (>1024×768)
 * - 1920×1080 (2.07 MP) -> 2mp (>2 MP)
 * - 3840×2160 (8.29 MP) -> 8mp (>8 MP)
 */
const IMAGE_SIZE_BUCKETS = [
  { mp: 0.12, label: 'qsvga' }, // > 400×300
  { mp: 0.307, label: 'vga' }, // > 640×480
  { mp: 0.48, label: 'svga' }, // > 800×600
  { mp: 0.786, label: 'xga' }, // > 1024×768
  { mp: 2, label: '2mp' }, // > 2 MP
  { mp: 4, label: '4mp' }, // > 4 MP
  { mp: 6, label: '6mp' }, // > 6 MP
  { mp: 8, label: '8mp' }, // > 8 MP
  { mp: 10, label: '10mp' }, // > 10 MP
  { mp: 12, label: '12mp' }, // > 12 MP
  { mp: 15, label: '15mp' }, // > 15 MP
  { mp: 20, label: '20mp' }, // > 20 MP
  { mp: 40, label: '40mp' }, // > 40 MP
  { mp: 70, label: '70mp' }, // > 70 MP
] as const;

export function tbsSizeLabelForPixels(pixels: number): string {
  const targetMp = pixels / 1_000_000;
  const selected =
    IMAGE_SIZE_BUCKETS.findLast((bucket) => bucket.mp <= targetMp) ?? IMAGE_SIZE_BUCKETS[IMAGE_SIZE_BUCKETS.length - 1];
  return selected.label;
}
