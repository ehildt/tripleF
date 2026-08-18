import { ref } from 'vue';

import {
  TEMPLATE_NAMES,
  TEMPLATE_PARTS,
  type TemplateName,
} from './template-parts.constant';

/**
 * Client-side per-template part visibility: which optional response parts
 * (image gallery, video gallery, key findings, quote, …) the dashboard
 * renders for each template. Pure display preference — the model still
 * produces every part; a disabled part simply drops its data keys before
 * the template component renders, and every section self-hides when its
 * data is absent. Configured in SysCtl → Layouts.
 */

const STORAGE_KEY = 'vision-template-parts';

export type TemplatePartsVisibility = Record<
  TemplateName,
  Record<string, boolean>
>;

/** Every part of every template enabled (the pristine default). */
export function buildDefaultTemplateParts(): TemplatePartsVisibility {
  return Object.fromEntries(
    TEMPLATE_NAMES.map((template) => [
      template,
      Object.fromEntries(
        TEMPLATE_PARTS[template].map((part) => [part.id, true]),
      ),
    ]),
  ) as TemplatePartsVisibility;
}

function loadTemplateParts(): TemplatePartsVisibility {
  const defaults = buildDefaultTemplateParts();
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}',
    ) as Partial<TemplatePartsVisibility>;
    for (const template of TEMPLATE_NAMES) {
      const savedParts = saved[template];
      if (!savedParts || typeof savedParts !== 'object') continue;
      for (const [partId, enabled] of Object.entries(savedParts)) {
        if (partId in defaults[template]) {
          defaults[template][partId] = enabled !== false;
        }
      }
    }
  } catch {
    /* storage unavailable or corrupt — stay on the pristine defaults */
  }
  return defaults;
}

function saveTemplateParts(visibility: TemplatePartsVisibility): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  } catch {
    /* storage unavailable — the setting stays in-memory only */
  }
}

export const templatePartsVisibility =
  ref<TemplatePartsVisibility>(loadTemplateParts());

export function isTemplatePartVisible(
  template: string,
  partId: string,
): boolean {
  return (
    templatePartsVisibility.value[template as TemplateName]?.[partId] ?? true
  );
}

export function setTemplatePartVisible(
  template: TemplateName,
  partId: string,
  visible: boolean,
): void {
  const parts = templatePartsVisibility.value[template];
  if (!parts || !(partId in parts)) return;
  parts[partId] = visible;
  saveTemplateParts(templatePartsVisibility.value);
}

export function toggleTemplatePartVisible(
  template: TemplateName,
  partId: string,
): void {
  setTemplatePartVisible(
    template,
    partId,
    !isTemplatePartVisible(template, partId),
  );
}

export function resetTemplateParts(): void {
  templatePartsVisibility.value = buildDefaultTemplateParts();
  saveTemplateParts(templatePartsVisibility.value);
}
