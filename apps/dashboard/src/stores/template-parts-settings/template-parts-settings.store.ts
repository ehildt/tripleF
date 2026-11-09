import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { buildDefaultTemplateParts } from './helpers/build-default-template-parts.helper';
import { isTemplateName } from './helpers/is-template-name.helper';
import { parseTemplatePartsVisibility } from './helpers/parse-template-parts-visibility.helper';
import { TEMPLATE_PARTS_STORAGE_KEY } from './template-parts-settings.constant';
import type { TemplateName } from './template-parts-settings.model';
import type { TemplatePartsVisibility } from './template-parts-settings.types';

/**
 * Client-side per-template part visibility: which optional response parts
 * (image gallery, video gallery, key findings, quote, …) the dashboard
 * renders for each template. Pure display preference — the model still
 * produces every part; a disabled part simply drops its data keys before
 * the template component renders, and every section self-hides when its
 * data is absent. Configured in Settings → Layouts.
 */
export const useTemplatePartsSettingsStore = defineStore(
  'templatePartsSettings',
  () => {
    const templatePartsVisibility = ref<TemplatePartsVisibility>(
      buildDefaultTemplateParts(),
    );

    try {
      templatePartsVisibility.value = parseTemplatePartsVisibility(
        localStorage.getItem(TEMPLATE_PARTS_STORAGE_KEY),
      );
    } catch {
      /* Storage unavailable: retain fresh canonical defaults. */
    }

    watch(
      templatePartsVisibility,
      (visibility) => {
        try {
          localStorage.setItem(
            TEMPLATE_PARTS_STORAGE_KEY,
            JSON.stringify(visibility),
          );
        } catch {
          /* Storage unavailable: retain visibility in memory. */
        }
      },
      { deep: true, flush: 'sync' },
    );

    function isTemplatePartVisible(template: string, partId: string): boolean {
      if (!isTemplateName(template)) return true;
      const parts = templatePartsVisibility.value[template];
      return Object.hasOwn(parts, partId) ? parts[partId] : true;
    }

    function setTemplatePartVisible(
      template: TemplateName,
      partId: string,
      visible: boolean,
    ): void {
      const parts = templatePartsVisibility.value[template];
      if (!parts || !Object.hasOwn(parts, partId)) return;
      parts[partId] = visible;
    }

    function toggleTemplatePartVisible(
      template: TemplateName,
      partId: string,
    ): void {
      setTemplatePartVisible(
        template,
        partId,
        !isTemplatePartVisible(template, partId),
      );
    }

    function resetTemplateParts(): void {
      templatePartsVisibility.value = buildDefaultTemplateParts();
    }

    return {
      templatePartsVisibility,
      isTemplatePartVisible,
      setTemplatePartVisible,
      toggleTemplatePartVisible,
      resetTemplateParts,
    };
  },
);
