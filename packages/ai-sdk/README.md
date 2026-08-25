<div align="center">

# @triplef/ai-sdk

A NestJS module for the Vercel AI SDK with Ollama — streaming and generation clients, model catalog, and model warm-up.

`This library is **ESM-only** and does not support CommonJS.`  
`Your project must use ES modules.`

</div>

<br>

<!-- DEPBADGE:START -->
<div align="center">

# StatusBadges

![github](https://img.shields.io/github/release/ehildt/tripleF?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/stars/ehildt/tripleF?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/license/ehildt/tripleF?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)

</div>

<br>

<div align="center">

# DevDependencies

![@changesets/cli](https://img.shields.io/badge/_changesets_cli-v3.0.1-82ba21.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=82ba21&logoWidth=40&style=flat-square)
![@eslint/js](https://img.shields.io/badge/_eslint_js-v10.0.1-7a23a9.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=7a23a9&logoWidth=40&style=flat-square)
![@nestjs/testing](https://img.shields.io/badge/_nestjs_testing-v11.2.3-c02635.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c02635&logoWidth=40&style=flat-square)
![@types/eslint](https://img.shields.io/badge/_types_eslint-v9.6.1-d936d0.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=d936d0&logoWidth=40&style=flat-square)
![@types/node](https://img.shields.io/badge/_types_node-v26.3.0-d51a33.svg?labelColor=333&cacheSeconds=3600&logo=node&logoColor=d51a33&logoWidth=40&style=flat-square)
![@vitest/coverage-v8](https://img.shields.io/badge/_vitest_coverage_v8-4.1.11-92d435.svg?labelColor=333&cacheSeconds=3600&logo=vitest&logoColor=92d435&logoWidth=40&style=flat-square)
![depcheck](https://img.shields.io/badge/depcheck-v1.4.7-28a95e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28a95e&logoWidth=40&style=flat-square)
![dependency-cruiser](https://img.shields.io/badge/dependency_cruiser-v18.2.0-c22431.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c22431&logoWidth=40&style=flat-square)
![eslint](https://img.shields.io/badge/eslint-v10.9.1-3f2ab7.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=3f2ab7&logoWidth=40&style=flat-square)
![eslint-config-prettier](https://img.shields.io/badge/eslint_config_prettier-v10.1.8-c4921c.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=c4921c&logoWidth=40&style=flat-square)
![eslint-plugin-prettier](https://img.shields.io/badge/eslint_plugin_prettier-v5.5.6-d19d2e.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=d19d2e&logoWidth=40&style=flat-square)
![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint_plugin_simple_import_sort-v14.0.0-39d025.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=39d025&logoWidth=40&style=flat-square)
![eslint-plugin-sonarjs](https://img.shields.io/badge/eslint_plugin_sonarjs-v4.2.0-ca216a.svg?labelColor=333&cacheSeconds=3600&logo=sonar&logoColor=ca216a&logoWidth=40&style=flat-square)
![globals](https://img.shields.io/badge/globals-v17.11.0-2570b1.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2570b1&logoWidth=40&style=flat-square)
![husky](https://img.shields.io/badge/husky-v9.1.7-2e81b8.svg?labelColor=333&cacheSeconds=3600&logo=husky&logoColor=2e81b8&logoWidth=40&style=flat-square)
![jiti](https://img.shields.io/badge/jiti-v2.7.0-2ab746.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2ab746&logoWidth=40&style=flat-square)
![lint-staged](https://img.shields.io/badge/lint_staged-v17.3.0-dfba26.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dfba26&logoWidth=40&style=flat-square)
![npm-check-updates](https://img.shields.io/badge/npm_check_updates-v23.1.0-1ec23c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1ec23c&logoWidth=40&style=flat-square)
![prettier](https://img.shields.io/badge/prettier-v3.9.6-48bd28.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=48bd28&logoWidth=40&style=flat-square)
![reflect-metadata](https://img.shields.io/badge/reflect_metadata-v0.2.2-2489db.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2489db&logoWidth=40&style=flat-square)
![rimraf](https://img.shields.io/badge/rimraf-v6.1.3-24a85b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=24a85b&logoWidth=40&style=flat-square)
![ts-unused-exports](https://img.shields.io/badge/ts_unused_exports-v11.0.1-5e26c0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=5e26c0&logoWidth=40&style=flat-square)
![tsup](https://img.shields.io/badge/tsup-v8.5.1-472cce.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=472cce&logoWidth=40&style=flat-square)
![typescript](https://img.shields.io/badge/typescript-v6.0.3-4c2eb8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4c2eb8&logoWidth=40&style=flat-square)
![typescript-eslint](https://img.shields.io/badge/typescript_eslint-v8.68.0-dc2e59.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=dc2e59&logoWidth=40&style=flat-square)
![vitest](https://img.shields.io/badge/vitest-v4.1.11-80c026.svg?labelColor=333&cacheSeconds=3600&logo=vitest&logoColor=80c026&logoWidth=40&style=flat-square)

</div>

<br>

<div align="center">

# PeerDependencies

[![@nestjs/common](https://img.shields.io/badge/_nestjs_common-v11.1.17-88de2b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=88de2b&logoWidth=40&style=flat)](https://github.com/nestjs/nest)
[![ai](https://img.shields.io/badge/ai-v7.0.79-1d30af.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1d30af&logoWidth=40&style=flat)](https://github.com/vercel/ai)
[![joi](https://img.shields.io/badge/joi-v18.0.2-9f1eb3.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=9f1eb3&logoWidth=40&style=flat)](https://github.com/sideway/joi)

</div>
<!-- DEPBADGE:END -->

<br>

## Features

- **NestJS-native** — a dynamic module (`registerAsync`) wiring the AI SDK services to caller-supplied `AiSdkConfig`.
- **Streaming & generation** — `streamChat`, `generateChat`, `compactContent`, and `generateWithTools` backed by `ollama-ai-provider-v2`.

## Installation

```sh
pnpm add @triplef/ai-sdk
```

## Usage

### Module setup

The library ships no env-driven config — supply the `AiSdkConfig` through a
factory, and validate it with the exported `AiSdkConfigSchema`.

```ts
import { AiSdkModule, AiSdkConfigSchema } from '@triplef/ai-sdk';
import { ValidateReturnValue } from '@triplef/config-factory/validate-return-value';

@Module({
  imports: [
    AiSdkModule.registerAsync({
      global: true,
      inject: [MyAiSdkConfigService],
      useFactory: (config: MyAiSdkConfigService) => config.options,
    }),
  ],
})
export class AppModule {}
```

### Streaming a chat

```ts
import { AiSdkService } from '@triplef/ai-sdk';

@Injectable()
export class ChatService {
  constructor(private readonly aiSdk: AiSdkService) {}

  async stream(messages: InputMessage[]) {
    return this.aiSdk.streamChat({ model: 'llama3.2', messages });
  }
}
```

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt)

</div>
<br>
