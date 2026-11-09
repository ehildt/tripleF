<div align="center">

# @triplef/core-logger

A lightweight NestJS `LoggerService` backed by pino — structured logging with inline context rendering and error-stack preservation.

`This library is **ESM-only** and does not support CommonJS.`  
`Your project must use ES modules.`

</div>

<br>

<!-- DEPBADGE:START -->
<div align="center">

# StatusBadges

![github](https://img.shields.io/github/release/ehildt/tripleF?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/stars/ehildt/tripleF?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![license](https://img.shields.io/badge/license-PolyForm%20Strict%201.0.0-b16425?labelColor=333&style=for-the-badge&logo=github&logoColor=b16425&logoWidth=40)

</div>

<br>

<div align="center">

# DevDependencies

![@changesets/cli](https://img.shields.io/badge/_changesets_cli-v3.0.3-82ba21.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=82ba21&logoWidth=40&style=flat-square)
![@eslint/js](https://img.shields.io/badge/_eslint_js-v10.0.1-7a23a9.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=7a23a9&logoWidth=40&style=flat-square)
![@types/eslint](https://img.shields.io/badge/_types_eslint-v9.6.1-d936d0.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=d936d0&logoWidth=40&style=flat-square)
![@types/node](https://img.shields.io/badge/_types_node-v26.6.6-d51a33.svg?labelColor=333&cacheSeconds=3600&logo=node&logoColor=d51a33&logoWidth=40&style=flat-square)
![@vitest/coverage-v8](https://img.shields.io/badge/_vitest_coverage_v8-5.1.0-92d435.svg?labelColor=333&cacheSeconds=3600&logo=vitest&logoColor=92d435&logoWidth=40&style=flat-square)
![depcheck](https://img.shields.io/badge/depcheck-v1.4.7-28a95e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28a95e&logoWidth=40&style=flat-square)
![dependency-cruiser](https://img.shields.io/badge/dependency_cruiser-v18.7.2-c22431.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c22431&logoWidth=40&style=flat-square)
![eslint](https://img.shields.io/badge/eslint-v10.14.0-3f2ab7.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=3f2ab7&logoWidth=40&style=flat-square)
![eslint-config-prettier](https://img.shields.io/badge/eslint_config_prettier-v10.1.8-c4921c.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=c4921c&logoWidth=40&style=flat-square)
![eslint-plugin-prettier](https://img.shields.io/badge/eslint_plugin_prettier-v5.5.7-d19d2e.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=d19d2e&logoWidth=40&style=flat-square)
![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint_plugin_simple_import_sort-v14.0.0-39d025.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=39d025&logoWidth=40&style=flat-square)
![eslint-plugin-sonarjs](https://img.shields.io/badge/eslint_plugin_sonarjs-v4.2.2-ca216a.svg?labelColor=333&cacheSeconds=3600&logo=sonar&logoColor=ca216a&logoWidth=40&style=flat-square)
![globals](https://img.shields.io/badge/globals-v17.14.0-2570b1.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2570b1&logoWidth=40&style=flat-square)
![husky](https://img.shields.io/badge/husky-v9.1.7-2e81b8.svg?labelColor=333&cacheSeconds=3600&logo=husky&logoColor=2e81b8&logoWidth=40&style=flat-square)
![jiti](https://img.shields.io/badge/jiti-v2.7.0-2ab746.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2ab746&logoWidth=40&style=flat-square)
![lint-staged](https://img.shields.io/badge/lint_staged-v17.6.0-dfba26.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dfba26&logoWidth=40&style=flat-square)
![npm-check-updates](https://img.shields.io/badge/npm_check_updates-v23.1.1-1ec23c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1ec23c&logoWidth=40&style=flat-square)
![prettier](https://img.shields.io/badge/prettier-v3.9.10-48bd28.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=48bd28&logoWidth=40&style=flat-square)
![rimraf](https://img.shields.io/badge/rimraf-v6.1.4-24a85b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=24a85b&logoWidth=40&style=flat-square)
![ts-unused-exports](https://img.shields.io/badge/ts_unused_exports-v11.0.1-5e26c0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=5e26c0&logoWidth=40&style=flat-square)
![tsup](https://img.shields.io/badge/tsup-v8.5.1-472cce.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=472cce&logoWidth=40&style=flat-square)
![typescript](https://img.shields.io/badge/typescript-v5.9.3-4c2eb8.svg?labelColor=333&cacheSeconds=3600&logo=typescript&logoColor=4c2eb8&logoWidth=40&style=flat-square)
![typescript-eslint](https://img.shields.io/badge/typescript_eslint-v8.72.1-dc2e59.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=dc2e59&logoWidth=40&style=flat-square)
![vitest](https://img.shields.io/badge/vitest-v5.1.0-80c026.svg?labelColor=333&cacheSeconds=3600&logo=vitest&logoColor=80c026&logoWidth=40&style=flat-square)

</div>

<br>

<div align="center">

# PeerDependencies

[![@nestjs/common](https://img.shields.io/badge/_nestjs_common-v12.4.0-88de2b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=88de2b&logoWidth=40&style=flat)](https://github.com/nestjs/nest)
[![pino](https://img.shields.io/badge/pino-v10.4.0-2fc15b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2fc15b&logoWidth=40&style=flat)](https://github.com/pinojs/pino)
[![pino-pretty](https://img.shields.io/badge/pino_pretty-v13.2.0-28acb8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28acb8&logoWidth=40&style=flat)](https://github.com/pinojs/pino-pretty)

</div>
<!-- DEPBADGE:END -->

<br>

## Features

- **NestJS-native** — implements `LoggerService` (`log`, `error`, `warn`, `debug`, `verbose`, `fatal`, `setLogLevels`); the service owns the pino client and delegates to it.
- **Inline context** — the trailing context string NestJS's static `Logger` appends renders as `[Context] message` in pretty mode and stays a structured `context` field in JSON mode.
- **Error preservation** — Error instances flow through pino's `err` serializer (type, message, stack); a bare `error(message, stack, context)` stack string is kept verbatim under `stack`.
- **pino object-first form** — `log({ requestId }, 'request received')` merges bindings with the NestJS context.

## Call shapes

| Call                               | Pino call                                     |
| ---------------------------------- | --------------------------------------------- |
| `log('hello')`                     | `info('hello')`                               |
| `log('hello', 'Ctx')`              | `info({ context: 'Ctx' }, 'hello')`           |
| `log({ requestId }, 'msg', 'Ctx')` | `info({ requestId, context: 'Ctx' }, 'msg')`  |
| `log('msg', { requestId }, 'Ctx')` | `info({ requestId, context: 'Ctx' }, 'msg')`  |
| `error(err, 'Ctx')`                | `error({ err, context: 'Ctx' }, err.message)` |
| `error('msg', err, 'Ctx')`         | `error({ err, context: 'Ctx' }, 'msg')`       |
| `error('msg', stack, 'Ctx')`       | `error({ stack, context: 'Ctx' }, 'msg')`     |
| `verbose(msg)`                     | `trace(msg)`                                  |

## Installation

```sh
pnpm add @triplef/core-logger
```

## Usage

### Module setup

The library ships no env-driven config — supply the pino `LoggerOptions`
through a factory, and validate them with the exported `CoreLoggerSchema`.

```ts
import { CoreLoggerModule, CoreLoggerSchema } from '@triplef/core-logger';
import { ValidateReturnValue } from '@triplef/config-factory/validate-return-value';

@Module({
  imports: [
    CoreLoggerModule.registerAsync({
      global: true,
      inject: [MyLoggerConfigService],
      useFactory: (config: MyLoggerConfigService) => config.options,
    }),
  ],
})
export class AppModule {}
```

### Bootstrap

```ts
import { CoreLoggerService } from '@triplef/core-logger';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(CoreLoggerService));
```

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt)

</div>
<br>
