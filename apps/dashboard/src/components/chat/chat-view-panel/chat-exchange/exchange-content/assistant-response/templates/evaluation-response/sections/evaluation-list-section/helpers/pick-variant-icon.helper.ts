import type { EvaluationListSectionProps } from '../EvaluationListSection.types';

/** Maps an evaluation list variant to its marker glyph. */
export function pickVariantIcon(
  variant?: EvaluationListSectionProps['variant'],
): string {
  switch (variant) {
    case 'strength':
      return '+';
    case 'weakness':
      return '−';
    case 'recommendation':
      return '→';
    default:
      return '•';
  }
}
