/**
 * Option list for a memory model-override select: the env-baseline default
 * label first, the catalog models after it. An override that is missing from
 * the catalog (model removed or catalog not loaded yet) is appended so the
 * select still shows and offers the configured value.
 */
export function buildModelSelectOptions(
  options: readonly string[],
  currentValue: string,
  defaultLabel: string,
): string[] {
  const catalog =
    currentValue && !options.includes(currentValue)
      ? [...options, currentValue]
      : [...options];
  return [defaultLabel, ...catalog];
}
