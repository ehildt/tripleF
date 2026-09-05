<div align="center">

# @triplef/agent

The tripleF (3F) agent domain — structured-output schemas, prompt builders, and model tools shared across the apps.

`This library is **ESM-only** and does not support CommonJS.`  
`Your project must use ES modules.`

</div>

<br>

<!-- DEPBADGE:START -->
<!-- DEPBADGE:END -->

## Subpath exports

- `@triplef/agent/schemas` — Zod schemas and `z.infer` types for intent classification, response templates, and memory extraction/consolidation/profile, plus URL-trust and Zod-shape helpers (`formatZodShape`, `deriveSchemaKeys`) and the `EncyclopediaSelectInput`/`EncyclopediaSelectResult` retrieval-selection contract.
- `@triplef/agent/prompts` — harness and memory prompt builders, the snippet system, and `buildStructuredPrompt` (renders a schema's JSON shape into a prompt template).
- `@triplef/agent/tools` — search/tool factories (Serper, Bright Data, YouTube, web-fetch, image-variants, memory) with a decoupled `ToolDependencies` contract.

## Usage

```ts
import { intentSchema } from '@triplef/agent/schemas';
import { buildStructuredPrompt } from '@triplef/agent/prompts';
import { createSerperWebSearch } from '@triplef/agent/tools';
```

`ai` and `zod` are peer dependencies; `ai` is optional (only the `/tools` subpath needs it).

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt)

</div>
<br>
