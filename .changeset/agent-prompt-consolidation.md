---
'@triplef/agent': minor
---

Refine and consolidate the prompt system:

- Image-task redesign (describe/compare/ocr): cloud reference candidates are now pure search-result DATA — the respond model picks evidence by textual corroboration (title/snippet/source vs. its own reading of the uploads) and never receives candidate pixels. The uploaded images still travel as attachments and still never enter the response gallery; unpicked candidates stay auditable in `discardedReferences`. Aligns `image-task-rule`, the compare/describe/ocr instructions, the correction prompt, and the intent prompt's fan-out/image-self-analysis wording with this contract.
- `buildContentSystemPrompt` no longer repeats SECURITY/NOISE/MULTIMODAL rules — the base system message is their single carrier through the pipeline.
- Split the intent-selection monolith into composed section modules (`harness/intent-selection/`), with one language-rules builder, one final reminder, and the AVAILABLE TEMPLATES list derived from `TEMPLATE_VARIANTS` (the stockmarket pair can no longer go missing).
- New shared constants: `DEFAULT_MEDIA_COUNT`/`MORE_MEDIA_COUNT` and `EMBEDDABLE_VIDEO_PROVIDER_LABELS`/`EMBEDDABLE_VIDEO_PROVIDER_CLAUSE` (schemas), interpolated across intent/execute/structured prompts and tool descriptions so prose cannot drift from pipeline behavior. New `IMAGE_TASK_TEMPLATES`/`isImageTaskTemplate` in schemas.
- New shared helpers: `buildVocabularySection` and `formatProvenanceLine` (memory prompts), replacing three verbatim copies.
- New harness prompt builders absorbed from the apps: `buildToolExecutePrompt`, `buildImageExecutePrompt`, `buildExecuteLanguageInstruction`, `buildStockmarketNote`, `buildMissingToolsPrompt`, `buildCorrectionPrompt`, `buildMergeDirective`, `buildClassifyTranscript`, `buildMemoryProbeSection`, `buildClarificationTranslationSystemPrompt`/`buildClarificationTranslationUserPrompt`, `formatCurrentTimestamp`.
- New memory prompts absorbed from the memory app: `BELIEF_INSTRUCTIONS` + `buildBeliefSynthesisPrompt`, `FRICTION_INSTRUCTIONS` + `buildFrictionPrompt`, `buildEncyclopediaClassifyPrompt`, and the `EncyclopediaClassifySchema` in schemas.
- PRECEDENCE rules now name the sections that actually exist in the respond prompt.
- Removed the dead `formatToolCatalog` helper and the redundant `TEMPLATE_VARIANTS` re-export.
