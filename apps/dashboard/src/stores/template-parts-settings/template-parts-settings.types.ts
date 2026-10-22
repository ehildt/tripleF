import type { TemplateName } from './template-parts-settings.constant';

/**
 * Per-template, per-part on/off map persisted as the template-parts widget
 * setting: `visibility[template][partId] === false` hides that part.
 */
export type TemplatePartsVisibility = Record<
  TemplateName,
  Record<string, boolean>
>;
