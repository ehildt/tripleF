import { computed, ref } from 'vue';

import type {
  PreprocessingParametersOptions,
  PreprocessingVariantsOptions,
} from '@/types/preprocessing.model';

import {
  PARAMETER_VARIANTS,
  VARIANT_PARAMETERS,
} from './parameter-highlight-links.constant';

/**
 * Variant/parameter hover cross-highlight for the preprocessing panels:
 * hovering a variant tile highlights the advanced parameters that variant
 * drives; hovering a parameter tile highlights the variants that read it.
 * Consumers assign the hovered refs directly on mouseenter/leave and read
 * `.includes(key)` off the highlighted collections.
 *
 * Module-scope singleton (rule 20): the variant tiles and the parameter
 * tiles live in sibling sections, so the hover must be one shared source of
 * truth across both. The spec resets the hovered refs between tests. This
 * slice used to live in the preprocessing Pinia store; it controls component
 * hover state, so per convention it is a composable.
 */
const hoveredVariant = ref<keyof PreprocessingVariantsOptions | null>(null);
const hoveredParameter = ref<keyof PreprocessingParametersOptions | null>(null);

const highlightedParameters = computed(() => {
  if (!hoveredVariant.value) return [];
  return VARIANT_PARAMETERS[hoveredVariant.value] ?? [];
});

const highlightedVariants = computed(() => {
  if (!hoveredParameter.value) return [];
  return PARAMETER_VARIANTS[hoveredParameter.value] ?? [];
});

export function useParameterHighlight() {
  return {
    hoveredVariant,
    hoveredParameter,
    highlightedParameters,
    highlightedVariants,
  };
}
