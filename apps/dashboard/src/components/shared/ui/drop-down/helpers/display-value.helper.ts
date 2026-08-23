export function displayValue(
  modelValue: string,
  placeholder: string,
  label: string,
  formatValue?: (value: string) => string,
): string {
  if (!modelValue) return placeholder || label;
  return formatValue ? formatValue(modelValue) : modelValue;
}
