import { z } from 'zod';

import {
  TOOL_NAMES,
  VARIANT_NAMES,
} from '../helpers/tool-registry.constants.js';

export const DEFAULT_VARIANT_ID = 'default';

export const TEMPLATES = [
  'article',
  'news',
  'describe',
  'compare',
  'ocr',
  'summary',
  'evaluation',
  'product',
  'imagelist',
  'videolist',
  'text',
  'compact',
] as const;

export type TemplateName = (typeof TEMPLATES)[number];

/* ── Zod schema for structured output from the intent classifier ───────── */

export const ImagePlanSchema = z.object({
  resize: z
    .boolean()
    .default(true)
    .describe(
      'Whether to resize the original images before sending them to the response model. Default true when images are present.',
    ),

  variants: z
    .array(z.enum(VARIANT_NAMES))
    .default([])
    .describe(
      'Optional preprocessing variants to generate for the images (grayscale, denoised, sharpened, clahe). Only use when they would materially improve analysis.',
    ),
});

export const IntentSchema = z.object({
  template: z
    .enum(TEMPLATES)
    .describe(
      'Template name: "article" (research/report), "news" (current events/news brief), "describe" (single/multi image description), "compare" (compare images), "ocr" (extract text from images), "summary" (recap prior conversation or topic without new images), "evaluation" (critique/assess something from the conversation), "product" (product details with shop offers and prices), "imagelist" (a pure collection of images about a topic, no article), "videolist" (a pure list/playlist of videos about a topic, no article), "text" (free chat), "compact" (summarize/condense prior conversation).',
    ),

  prompt: z
    .string()
    .default(DEFAULT_VARIANT_ID)
    .describe(
      'Selected prompt variant for the template. Use "default" unless the user explicitly asks for a specific style.',
    ),

  tools: z
    .array(z.enum(TOOL_NAMES))
    .describe('List of tool names the model decided to invoke.'),

  imageCount: z
    .preprocess(
      (val) => (val === null ? 0 : val),
      z.number().int().min(0).max(50).default(0),
    )
    .describe(
      'Number of images to retrieve when an imageSearch tool is selected. Only set when the user explicitly requests a specific number; otherwise omit or set to 0 and the system will default to 6.',
    ),

  videoCount: z
    .preprocess(
      (val) => (val === null ? 0 : val),
      z.number().int().min(0).max(50).default(0),
    )
    .describe(
      'Number of videos to retrieve when a videoSearch tool is selected. Only set when the user explicitly requests a specific number; otherwise omit or set to 0 and the system will default to 6.',
    ),

  reasoning: z
    .string()
    .describe(
      'Short explanation of why this template, prompt, and these tools were chosen.',
    ),

  contextSummary: z
    .string()
    .default('')
    .describe(
      'Concise but complete summary of the prior conversation context that is relevant to the current user request. Empty if there is no relevant prior context.',
    ),

  needsClarification: z
    .boolean()
    .default(false)
    .describe(
      'When true, the request is too ambiguous to classify — set this instead of picking template/tools.',
    ),

  clarificationQuestion: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Concise, human-friendly question to ask the user when needsClarification is true. Ask what the user might have meant and offer the most likely interpretations as options. Do not hardcode wording; adapt tone and language to the user.',
    ),

  language: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Two-letter ISO language code of the latest user message (e.g. 'en', 'de', 'ja', 'es'). Detect from the user's text.",
    ),

  plan: z
    .object({
      images: ImagePlanSchema.optional().describe(
        'Image processing plan. Only present when images are attached.',
      ),
    })
    .default({})
    .describe('Execution plan for the response step.'),
});

export type IntentResult = z.infer<typeof IntentSchema>;
export type ImagePlan = z.infer<typeof ImagePlanSchema>;
