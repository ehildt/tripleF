<div align="center">

# @triplef/bullmq

A NestJS module for BullMQ integration with configuration types and validation schemas.

`This library is **ESM-only** and does not support CommonJS.`  
`Your project must use ES modules.`

</div>

<br>

<!-- DEPBADGE:START -->
<!-- DEPBADGE:END -->

<br>

## Features

- **Queue registration** — registers one or more BullMQ queues from strings or `{ name, connection }` objects.
- **Shared config** — a single `useFactory` supplies the base `BullMQConfig` (connection, default job options) to every queue.
- **Per-queue overrides** — a queue-level `connection` wins over the factory output.
- **Validation schema** — `BullMQConfigSchema` validates connection and `defaultJobOptions` before the queues are registered.

## Installation

```sh
pnpm add @triplef/bullmq
```

## Usage

### Module setup

The library ships no env-driven config — supply the `BullMQConfig` through a
factory, and validate it with the exported `BullMQConfigSchema`.

```ts
import { BullMQModule, BullMQConfigSchema } from '@triplef/bullmq';
import { ValidateReturnValue } from '@triplef/config-factory/validate-return-value';

@Module({
  imports: [
    BullMQModule.registerAsync({
      global: true,
      inject: [MyBullMQConfigService],
      queues: ['harness', { name: 'vectorize', connection: { host: 'keydb' } }],
      processors: [MyProcessor],
      useFactory: (config: MyBullMQConfigService) => config.options,
    }),
  ],
})
export class AppModule {}
```

### Queue config

```ts
import type { BullMQConfig } from '@triplef/bullmq';

const config: BullMQConfig = {
  connection: { host: 'localhost', port: 6379 },
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
};
```

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt)

</div>
<br>
