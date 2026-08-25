<div align="center">

# @triplef/bullmq-logger

A NestJS logger for BullMQ jobs powered by pino — emoji state indicators, failed-reason/stacktrace capture, and safe state inference when `job.getState()` is unavailable.

`This library is **ESM-only** and does not support CommonJS.`  
`Your project must use ES modules.`

</div>

<br>

<!-- DEPBADGE:START -->
<!-- DEPBADGE:END -->

<br>

## Features

- **NestJS-native** — implements `LoggerService` (`log`, `error`, `warn`, `debug`, `verbose`) for BullMQ `Job` objects.
- **State indicators** — each log line carries an emoji icon for the job state (completed, failed, delayed, waiting, active, …).
- **Failure context** — `error()` attaches `failedReason` and `stacktrace` when the job failed.
- **Safe state inference** — falls back to job properties (`failedReason`, `finishedOn`, `processedOn`) when `getState()` is not available (BullMQ v5 error events).

## Installation

```sh
pnpm add @triplef/bullmq-logger
```

## Usage

### Module setup

The library ships no env-driven config — supply the pino `LoggerOptions`
through a factory, and validate them with the exported `BullMQLoggerSchema`.

```ts
import { BullMQLoggerModule, BullMQLoggerSchema } from '@triplef/bullmq-logger';
import { ValidateReturnValue } from '@triplef/config-factory/validate-return-value';

@Module({
  imports: [
    BullMQLoggerModule.registerAsync({
      global: true,
      inject: [MyLoggerConfigService],
      useFactory: (config: MyLoggerConfigService) => config.options,
    }),
  ],
})
export class AppModule {}
```

### Logging a job

```ts
import { BullMQLoggerService } from '@triplef/bullmq-logger';

@Injectable()
export class MyProcessor {
  constructor(private readonly logger: BullMQLoggerService) {}

  async process(job: Job) {
    await this.logger.log(job);
    await this.logger.error(job);
  }
}
```

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt)

</div>
<br>
