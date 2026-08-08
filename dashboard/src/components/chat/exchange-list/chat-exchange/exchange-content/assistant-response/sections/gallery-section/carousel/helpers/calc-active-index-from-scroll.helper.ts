export interface ScrollItemGeometry {
  offsetLeft: number;
  offsetWidth: number;
}

/**
 * Index of the track item whose center is nearest the track's viewport
 * center for the given scroll position. Returns 0 for an empty item list.
 */
export function calcActiveIndexFromScroll(
  scrollLeft: number,
  clientWidth: number,
  items: ScrollItemGeometry[],
): number {
  const trackCenter = scrollLeft + clientWidth / 2;
  let closest = 0;
  let closestDistance = Infinity;
  items.forEach((item, index) => {
    const center = item.offsetLeft + item.offsetWidth / 2;
    const distance = Math.abs(center - trackCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = index;
    }
  });
  return closest;
}
