import Joi from 'joi';

import {
  RESPONSE_LAYOUTS,
  type ResponseLayout,
} from '../../harness/snippets/response-layout.constant.js';

/**
 * Dynamic layout config: which art-direction layouts the response model may
 * compose snippet responses with (classic, editorial, split, mosaic).
 * Managed at runtime through the provider-overrides API (SysCtl), with env
 * vars as the pristine defaults — same contract as the sources overrides.
 */
export type LayoutsConfig = Record<ResponseLayout, boolean>;

const DEFAULT_LAYOUTS: LayoutsConfig = {
  classic: true,
  editorial: true,
  split: true,
  mosaic: true,
};

export const LayoutsConfigSchema = Joi.object<LayoutsConfig>({
  classic: Joi.boolean().required(),
  editorial: Joi.boolean().required(),
  split: Joi.boolean().required(),
  mosaic: Joi.boolean().required(),
}).required();

/**
 * Env override: LAYOUTS=classic,split limits the enabled layouts. Absent
 * means all four. classic is always enabled — every preset falls back to it.
 */
export function LayoutsConfigAdapter(env = process.env): LayoutsConfig {
  const enabled = new Set(
    (env.LAYOUTS ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry): entry is ResponseLayout =>
        (RESPONSE_LAYOUTS as readonly string[]).includes(entry),
      ),
  );
  if (enabled.size === 0) return { ...DEFAULT_LAYOUTS };
  return Object.fromEntries(
    RESPONSE_LAYOUTS.map((layout) => [
      layout,
      layout === 'classic' ? true : enabled.has(layout),
    ]),
  ) as LayoutsConfig;
}
