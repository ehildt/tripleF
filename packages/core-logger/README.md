<div align="center">

# @triplef/core-logger

A lightweight NestJS `LoggerService` backed by pino — structured logging with inline context rendering and error-stack preservation.

`This library is **ESM-only** and does not support CommonJS.`  
`Your project must use ES modules.`

</div>

<br>

<!-- DEPBADGE:START -->
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
