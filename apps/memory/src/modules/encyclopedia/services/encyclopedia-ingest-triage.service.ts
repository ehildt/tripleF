import { Injectable, Logger } from '@nestjs/common';
import {
  buildEncyclopediaIngestTriagePrompt,
  ENCYCLOPEDIA_INGEST_TRIAGE_INSTRUCTIONS,
} from '@triplef/agent/prompts';
import {
  EncyclopediaIngestTriageSchema,
  type EncyclopediaSearchResult,
  type EncyclopediaSourceDocument,
} from '@triplef/agent/schemas';
import { AiSdkService } from '@triplef/ai-sdk';
import { limitText } from '@triplef/helpers/limit-text';
import { parseLlmJson } from '@triplef/helpers/parse-llm-json';

import { buildProviderOptions } from '../../ollama/helpers/provider-options.helper.js';

import type { IngestTriageOutcome } from './encyclopedia-ingest-triage.service.types.js';

/** Per-document excerpt fed to the triage — enough to judge topicality. */
const DOCUMENT_EXCERPT_CHARS = 1200;
/** Per-result excerpt cap — snippets are short, but bound them anyway. */
const RESULT_EXCERPT_CHARS = 500;
/** Total triage payload cap — keeps the batched call cheap. */
const MAX_PAYLOAD_CHARS = 24_000;

/** Inputs of the ingest triage gate for one topic. */
interface IngestTriageParams {
  /** The topic the candidates must stay on. */
  topic: string;
  /** Full documents offered for ingestion. */
  documents: EncyclopediaSourceDocument[];
  /** Web search results offered for ingestion. */
  searchResults: EncyclopediaSearchResult[];
  /** Model override (defaults to the encyclopedia summarize model). */
  model?: string;
}

/**
 * Ingest triage: the LLM gate that keeps the encyclopedia on-topic. Before
 * anything is persisted, the model reads the turn's gathered candidates
 * (fetched documents + search-result snippets) against the topic and strips
 * the off-topic ones. Fail-closed: no model, an empty answer, or an
 * unparseable verdict persists nothing — the caller falls back to ephemeral
 * selection only, so the live turn still answers but the encyclopedia stays
 * clean.
 */
@Injectable()
export class EncyclopediaIngestTriageService {
  private readonly logger = new Logger(EncyclopediaIngestTriageService.name);

  constructor(private readonly aiSdkService: AiSdkService) {}

  async filter(params: IngestTriageParams): Promise<IngestTriageOutcome> {
    if (params.documents.length === 0 && params.searchResults.length === 0) {
      return {
        documents: params.documents,
        searchResults: params.searchResults,
        droppedDocuments: [],
      };
    }
    if (!params.model) {
      this.logger.warn(
        'encyclopedia ingest triage skipped: no model — nothing persisted',
      );
      return this.persistNothing(params.documents);
    }

    // Adaptive excerpt budget: a flat per-candidate excerpt would overflow
    // the payload cap on fetch-heavy turns, silently truncating the tail out
    // of the model's view (fail-closed then drops the unjudged). Split the
    // payload evenly so EVERY candidate is judged.
    const candidateCount =
      params.documents.length + params.searchResults.length;
    const excerptBudget = Math.floor(MAX_PAYLOAD_CHARS / candidateCount);

    const candidates = [
      ...params.documents.map((doc, index) => ({
        index,
        title: doc.title,
        excerpt: limitText(
          doc.content,
          Math.min(DOCUMENT_EXCERPT_CHARS, excerptBudget),
        ),
      })),
      ...params.searchResults.map((result, index) => ({
        index: params.documents.length + index,
        title: result.title,
        excerpt: limitText(
          result.snippet,
          Math.min(RESULT_EXCERPT_CHARS, excerptBudget),
        ),
      })),
    ];

    try {
      const { text } = await this.aiSdkService.generateChat({
        model: params.model,
        messages: [
          { role: 'system', content: ENCYCLOPEDIA_INGEST_TRIAGE_INSTRUCTIONS },
          {
            role: 'user',
            content: buildEncyclopediaIngestTriagePrompt({
              topic: params.topic,
              candidates,
              maxPayloadChars: MAX_PAYLOAD_CHARS,
            }),
          },
        ],
        providerOptions: buildProviderOptions({ think: false }),
        tools: {},
      });
      if (!text?.trim()) {
        this.logger.warn(
          'encyclopedia ingest triage returned empty — nothing persisted',
        );
        return this.persistNothing(params.documents);
      }
      const parsed = EncyclopediaIngestTriageSchema.safeParse(
        parseLlmJson(text),
      );
      if (!parsed.success) {
        this.logger.warn(
          'encyclopedia ingest triage unparseable — nothing persisted',
        );
        return this.persistNothing(params.documents);
      }

      const keep = new Set(
        parsed.data.decisions
          .filter((decision) => decision.keep)
          .map((decision) => decision.index),
      );
      const documents = params.documents.filter((_, index) => keep.has(index));
      const droppedDocuments = params.documents.filter(
        (_, index) => !keep.has(index),
      );
      const searchResults = params.searchResults.filter((_, index) =>
        keep.has(params.documents.length + index),
      );
      this.logger.log(
        `encyclopedia ingest triage: kept ${documents.length}/${params.documents.length} documents, ${searchResults.length}/${params.searchResults.length} results`,
      );
      return { documents, searchResults, droppedDocuments };
    } catch (error) {
      this.logger.warn(
        `encyclopedia ingest triage failed — nothing persisted: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.persistNothing(params.documents);
    }
  }

  /** Fail-closed outcome: nothing persists, every document stays ephemeral. */
  private persistNothing(
    documents: EncyclopediaSourceDocument[],
  ): IngestTriageOutcome {
    return { documents: [], searchResults: [], droppedDocuments: documents };
  }
}
