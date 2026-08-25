import { Injectable } from '@nestjs/common';
import { SNIPPET_TEMPLATE_PRESETS } from '@triplef/agent/prompts';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { normalizeJsonResponse } from '../helpers/json/normalize-json-response.helper.js';
import { sanitizeBlockedImageUrls } from '../helpers/sanitize/sanitize-blocked-image-urls.helper.js';
import { stripUrlsFromTextFields } from '../helpers/sanitize/strip-urls-from-text-fields.helper.js';
import {
  getOptionalKeys,
  getRequiredKeys,
} from '../helpers/template-placeholders.constant.js';

import { validateCompareOutput } from './response-validators/compare.validator.js';
import { createSnippetValidator } from './response-validators/create-snippet-validator.helper.js';
import { validateDescribeOutput } from './response-validators/describe.validator.js';
import { validateFreeFormOutput } from './response-validators/free-form.validator.js';
import { validateImagelistOutput } from './response-validators/imagelist.validator.js';
import { validateOcrOutput } from './response-validators/ocr.validator.js';
import { validateProductOutput } from './response-validators/product.validator.js';
import { validateShoplistOutput } from './response-validators/shoplist.validator.js';
import { validateStockmarketItemOutput } from './response-validators/stockmarketitem.validator.js';
import { validateStockmarketListOutput } from './response-validators/stockmarketlist.validator.js';
import { validateSummaryOutput } from './response-validators/summary.validator.js';
import type { ValidationResult } from './response-validators/validation-result.type.js';
import { validateVideolistOutput } from './response-validators/videolist.validator.js';

/**
 * Per-template response validators. news/article/evaluation are composed
 * from their snippet presets; the rest validate against their template zod
 * schema directly. All return a ValidationResult.
 */
const templateValidators: Record<
  string,
  (parsed: Record<string, unknown>) => ValidationResult
> = {
  article: createSnippetValidator(SNIPPET_TEMPLATE_PRESETS.article),
  news: createSnippetValidator(SNIPPET_TEMPLATE_PRESETS.news),
  evaluation: createSnippetValidator(SNIPPET_TEMPLATE_PRESETS.evaluation),
  merge: createSnippetValidator(SNIPPET_TEMPLATE_PRESETS.merge),
  describe: validateDescribeOutput,
  compare: validateCompareOutput,
  ocr: validateOcrOutput,
  summary: validateSummaryOutput,
  product: validateProductOutput,
  shoplist: validateShoplistOutput,
  stockmarketitem: validateStockmarketItemOutput,
  stockmarketlist: validateStockmarketListOutput,
  imagelist: validateImagelistOutput,
  videolist: validateVideolistOutput,
  text: validateFreeFormOutput,
};

import { MediaUrlValidatorService } from './media-url-validator.service.js';

/** Keys (lowercased) whose string values are display image URLs in template JSON. */
const OUTPUT_IMAGE_URL_KEYS = new Set([
  'heroimageurl',
  'imageurl',
  'thumbnailurl',
]);

/**
 * Takes a raw LLM text response through the full validation pipeline:
 *   strip fences → parse JSON → normalize → sanitize blocked URLs → enforce keys → schema-validate.
 */
@Injectable()
export class ResponseValidatorService {
  constructor(private readonly mediaUrlValidator: MediaUrlValidatorService) {}
  /**
   * Full-pipeline validator for raw model output.
   */
  validateJsonOutput(
    content: string,
    template: string,
    requiredKeys: string[],
    optionalKeys: string[],
  ): ValidationResult {
    const cleaned = content
      .trim()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    if (!cleaned) {
      return { valid: false, error: 'Response is empty.' };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseLlmJson(cleaned) as Record<string, unknown>;
    } catch (error) {
      return {
        valid: false,
        error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    parsed = normalizeJsonResponse(parsed, template);
    parsed = sanitizeBlockedImageUrls(parsed) as Record<string, unknown>;
    // Free-form templates may reference URLs in plain text; structured
    // templates must keep URLs inside their designated URL fields.
    if (template !== 'text') {
      parsed = stripUrlsFromTextFields(parsed) as Record<string, unknown>;
    }

    const missing = requiredKeys.filter((key) => !(key in parsed));
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required keys: ${missing.join(', ')}`,
      };
    }

    // Strip unexpected top-level keys that the dashboard does not consume
    const allKeys = new Set([...requiredKeys, ...optionalKeys]);
    const sanitized: Record<string, unknown> = {};
    for (const key of allKeys) {
      if (key in parsed) sanitized[key] = parsed[key];
    }

    return this.validateTemplateSchema(sanitized, template);
  }

  /**
   * Live-verify every external image URL the model emitted in a validated
   * response. The model can only see sanitized inputs, but it may still copy
   * unprobed URLs from fetched page text or earlier free-form content.
   * URLs that do not resolve to a real image are blanked so the dashboard
   * never renders dead media. "unknown" is kept on purpose: bot-blocking
   * CDNs may refuse server probes while serving real browsers fine.
   */
  async verifyOutputImageUrls(content: string): Promise<string> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return content;
    }

    const urls = new Set<string>();
    this.collectOutputImageUrls(parsed, urls);
    if (urls.size === 0) return content;

    const results = await this.mediaUrlValidator.validateUrls(
      Array.from(urls),
      { enabled: true, timeoutMs: 3000, maxRedirects: 3, concurrency: 5 },
    );

    const dead = new Set(
      results
        .filter(
          (r) => r.kind === 'broken' || r.kind === 'html' || r.kind === 'video',
        )
        .map((r) => r.url),
    );
    if (dead.size === 0) return content;

    this.blankDeadOutputImageUrls(parsed, dead);
    this.dropBlankedImageItems(parsed);
    return JSON.stringify(parsed);
  }

  /**
   * Remove gallery items whose image URL was blanked as dead — a blank URL
   * would still render as an empty, broken tile in the dashboard.
   */
  private dropBlankedImageItems(value: unknown): void {
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i--) {
        const item = value[i] as Record<string, unknown> | null;
        if (item !== null && typeof item === 'object' && item.imageUrl === '') {
          value.splice(i, 1);
        } else {
          this.dropBlankedImageItems(item);
        }
      }
      return;
    }
    if (value === null || typeof value !== 'object') return;

    for (const val of Object.values(value)) {
      this.dropBlankedImageItems(val);
    }
  }

  private collectOutputImageUrls(value: unknown, urls: Set<string>): void {
    if (Array.isArray(value)) {
      for (const item of value) this.collectOutputImageUrls(item, urls);
      return;
    }
    if (value === null || typeof value !== 'object') return;

    for (const [key, val] of Object.entries(value)) {
      if (
        typeof val === 'string' &&
        OUTPUT_IMAGE_URL_KEYS.has(key.toLowerCase()) &&
        (val.startsWith('http://') || val.startsWith('https://'))
      ) {
        urls.add(val);
      } else {
        this.collectOutputImageUrls(val, urls);
      }
    }
  }

  private blankDeadOutputImageUrls(value: unknown, dead: Set<string>): void {
    if (Array.isArray(value)) {
      for (const item of value) this.blankDeadOutputImageUrls(item, dead);
      return;
    }
    if (value === null || typeof value !== 'object') return;

    const record = value as Record<string, unknown>;
    for (const [key, val] of Object.entries(record)) {
      if (typeof val === 'string' && dead.has(val)) record[key] = '';
      else this.blankDeadOutputImageUrls(val, dead);
    }
  }

  /**
   * Shorthand that derives key sets from the template and runs the full pipeline.
   */
  validateValidatedResponse(
    rawContent: string,
    template: string,
  ): ValidationResult {
    const requiredKeys = getRequiredKeys(template);
    const optionalKeys = getOptionalKeys(template);
    return this.validateJsonOutput(
      rawContent,
      template,
      requiredKeys,
      optionalKeys,
    );
  }

  private validateTemplateSchema(
    parsed: Record<string, unknown>,
    template: string,
  ): ValidationResult {
    const validator = templateValidators[template];
    if (validator) return validator(parsed);
    return { valid: true, content: JSON.stringify(parsed) };
  }
}
