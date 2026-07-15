import { Inject, Injectable } from '@nestjs/common';

import { normalizeJsonResponse } from '../helpers/normalize-json-response.helper.js';
import { parseLlmJson } from '../helpers/parse-llm-json.helper.js';
import { sanitizeBlockedImageUrls } from '../helpers/sanitize-blocked-image-urls.helper.js';
import { stripUrlsFromTextFields } from '../helpers/strip-urls-from-text-fields.helper.js';
import {
  getOptionalKeys,
  getRequiredKeys,
} from '../helpers/template-placeholders.constant.js';
import {
  articleSchema,
  formatZodIssues,
} from '../schemas/article-json.schema.js';
import {
  compareSchema,
  formatZodIssues as formatCompareZodIssues,
} from '../schemas/compare-json.schema.js';
import {
  describeSchema,
  formatZodIssues as formatDescribeZodIssues,
} from '../schemas/describe-json.schema.js';
import {
  evaluationSchema,
  formatZodIssues as formatEvaluationZodIssues,
} from '../schemas/evaluation-json.schema.js';
import {
  formatZodIssues as formatImagelistZodIssues,
  imagelistSchema,
} from '../schemas/imagelist-json.schema.js';
import {
  formatZodIssues as formatNewsZodIssues,
  newsSchema,
} from '../schemas/news-json.schema.js';
import {
  formatZodIssues as formatOcrZodIssues,
  ocrSchema,
} from '../schemas/ocr-json.schema.js';
import {
  formatZodIssues as formatProductZodIssues,
  productSchema,
} from '../schemas/product-json.schema.js';
import {
  formatZodIssues as formatSummaryZodIssues,
  summarySchema,
} from '../schemas/summary-json.schema.js';
import {
  formatZodIssues as formatVideolistZodIssues,
  videolistSchema,
} from '../schemas/videolist-json.schema.js';

import { MediaUrlValidatorService } from './media-url-validator.service.js';

type ValidationResult =
  | { valid: true; content: string; error?: undefined }
  | { valid: false; error: string; content?: undefined };

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
  constructor(
    @Inject(MediaUrlValidatorService)
    private readonly mediaUrlValidator: MediaUrlValidatorService,
  ) {}
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
    if (template !== 'text' && template !== 'compact') {
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

  // --------------------------------------------------------------------------
  // Per-template schema validators
  // --------------------------------------------------------------------------

  private readonly templateValidators: Record<
    string,
    (parsed: Record<string, unknown>) => ValidationResult
  > = {
    article: this.validateArticleOutput.bind(this),
    news: this.validateNewsOutput.bind(this),
    describe: this.validateDescribeOutput.bind(this),
    compare: this.validateCompareOutput.bind(this),
    ocr: this.validateOcrOutput.bind(this),
    summary: this.validateSummaryOutput.bind(this),
    evaluation: this.validateEvaluationOutput.bind(this),
    product: this.validateProductOutput.bind(this),
    imagelist: this.validateImagelistOutput.bind(this),
    videolist: this.validateVideolistOutput.bind(this),
    text: this.validateFreeFormOutput.bind(this),
    compact: this.validateFreeFormOutput.bind(this),
  };

  private validateTemplateSchema(
    parsed: Record<string, unknown>,
    template: string,
  ): ValidationResult {
    const validator = this.templateValidators[template];
    if (validator) return validator(parsed);
    return { valid: true, content: JSON.stringify(parsed) };
  }

  private validateFreeFormOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    return { valid: true, content: JSON.stringify(parsed) };
  }

  private validateArticleOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = articleSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatZodIssues(schemaResult.error.issues)}`,
      };
    }

    const article = schemaResult.data;
    const textToRead = [
      article.title,
      article.summary,
      article.sectionContent,
      article.conclusion,
    ]
      .filter(Boolean)
      .join(' ');

    const readTime = article.readTime?.trim()
      ? article.readTime
      : this.computeReadTime(textToRead);

    return { valid: true, content: JSON.stringify({ ...article, readTime }) };
  }

  private validateNewsOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = newsSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatNewsZodIssues(schemaResult.error.issues)}`,
      };
    }

    const news = schemaResult.data;
    const textToRead = [
      news.headline,
      news.deck,
      news.lead,
      news.sectionContent,
    ]
      .filter(Boolean)
      .join(' ');

    const readTime = news.readTime?.trim()
      ? news.readTime
      : this.computeReadTime(textToRead);
    return { valid: true, content: JSON.stringify({ ...news, readTime }) };
  }

  private validateDescribeOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = describeSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatDescribeZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateCompareOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = compareSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatCompareZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateOcrOutput(parsed: Record<string, unknown>): ValidationResult {
    const schemaResult = ocrSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatOcrZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateSummaryOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = summarySchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatSummaryZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateEvaluationOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = evaluationSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatEvaluationZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateProductOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = productSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatProductZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateImagelistOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = imagelistSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatImagelistZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private validateVideolistOutput(
    parsed: Record<string, unknown>,
  ): ValidationResult {
    const schemaResult = videolistSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        valid: false,
        error: `Schema validation failed: ${formatVideolistZodIssues(schemaResult.error.issues)}`,
      };
    }

    return { valid: true, content: JSON.stringify(schemaResult.data) };
  }

  private computeReadTime(text: string): string {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  }
}
