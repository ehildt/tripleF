/** Project a track child into its offset shape. */
export function mapChildToOffset(child: Element) {
  const el = child as HTMLElement;
  return { offsetLeft: el.offsetLeft, offsetWidth: el.offsetWidth };
}
