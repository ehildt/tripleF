<div align="center">

# @triplef/core-logger

A NestJS `LoggerService` backed by pino — structured logging with inline context rendering, error-stack preservation, and per-call `onLog` hooks.

`This library is **ESM-only** and does not support CommonJS.`  
`Your project must use ES modules.`

</div>

<br>

<!-- DEPBADGE:START -->
<!-- DEPBADGE:END -->

<br>

## Features

- **NestJS-native** — implements `LoggerService` (`log`, `error`, `warn`, `debug`, `verbose`, `fatal`, `setLogLevels`).
- **Inline context** — the NestJS context renders as `[Context] message` in pretty mode, while staying a structured `context` field in JSON mode.
- **Error-stack preservation** — `error(message, stack, context)` attaches the stack as `err` instead of dropping it.
- **Per-call `onLog` hooks** — pass `onLog` in the meta object to run a fire-and-forget callback after the write (e.g. forward to an endpoint or database).

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

### onLog hook

The `onLog` key is reserved in the meta object. It is stripped before the log
is written and invoked afterwards, fire-and-forget.

```ts
logger.info('user signed up', {
  userId: '123',
  onLog: (entry) => sendToDb(entry),
});
```

`entry` is `{ level, message, context?, meta? }`.

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt)

</div>
<br>
