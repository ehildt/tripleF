import type { LayoutsConfig } from '../../../provider-overrides/configs/layouts-config.adapter.js';
import type { ResponseLayout } from '../response-layout.constant.js';
import type { SnippetTemplatePreset } from '../snippet.types.js';

/**
 * The layouts enabled for this request: preset-supported ∩ user-config —
 * classic as the always-available safety net when the intersection is empty
 * or the config is absent.
 */
export function resolveAllowedLayouts(
  preset: SnippetTemplatePreset,
  layouts?: LayoutsConfig,
): ResponseLayout[] {
  const enabled = layouts
    ? (Object.entries(layouts)
        .filter(([, isEnabled]) => isEnabled)
        .map(([layout]) => layout) as ResponseLayout[])
    : preset.supportedLayouts;
  const effective = enabled.filter((layout) =>
    preset.supportedLayouts.includes(layout),
  );
  return effective.length > 0 ? effective : ['classic'];
}
