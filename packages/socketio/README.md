<div align="center">

# @triplef/socketio

A NestJS module for building real-time applications with Socket.IO — room management, event handling, and a fluent emission API with Fastify/Express auto-detection.

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

[![@changesets/cli](https://img.shields.io/badge/_changesets_cli-v3.0.1-82ba21.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=82ba21&logoWidth=40&style=flat-square)](https://github.com/changesets/changesets)
[![@eslint/js](https://img.shields.io/badge/_eslint_js-v10.0.1-7a23a9.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=7a23a9&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@nestjs/testing](https://img.shields.io/badge/_nestjs_testing-v11.2.3-c02635.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c02635&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@types/eslint](https://img.shields.io/badge/_types_eslint-v9.6.1-d936d0.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=d936d0&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/node](https://img.shields.io/badge/_types_node-v26.3.0-d51a33.svg?labelColor=333&cacheSeconds=3600&logo=node&logoColor=d51a33&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@vitest/coverage-v8](https://img.shields.io/badge/_vitest_coverage_v8-4.1.11-92d435.svg?labelColor=333&cacheSeconds=3600&logo=vitest&logoColor=92d435&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![depcheck](https://img.shields.io/badge/depcheck-v1.4.7-28a95e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28a95e&logoWidth=40&style=flat-square)](https://github.com/depcheck/depcheck)
[![dependency-cruiser](https://img.shields.io/badge/dependency_cruiser-v18.2.0-c22431.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c22431&logoWidth=40&style=flat-square)](https://github.com/sverweij/dependency-cruiser)
[![eslint](https://img.shields.io/badge/eslint-v10.9.1-3f2ab7.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=3f2ab7&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![eslint-config-prettier](https://img.shields.io/badge/eslint_config_prettier-v10.1.8-c4921c.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=c4921c&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-config-prettier)
[![eslint-plugin-prettier](https://img.shields.io/badge/eslint_plugin_prettier-v5.5.6-d19d2e.svg?labelColor=333&cacheSeconds=3600&logo=prettier&logoColor=d19d2e&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-plugin-prettier)
[![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint_plugin_simple_import_sort-v14.0.0-39d025.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=39d025&logoWidth=40&style=flat-square)](https://github.com/lydell/eslint-plugin-simple-import-sort)
[![eslint-plugin-sonarjs](https://img.shields.io/badge/eslint_plugin_sonarjs-v4.2.0-ca216a.svg?labelColor=333&cacheSeconds=3600&logo=sonar&logoColor=ca216a&logoWidth=40&style=flat-square)](https://github.com/SonarSource/eslint-plugin-sonarjs)
[![globals](https://img.shields.io/badge/globals-v17.11.0-2570b1.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2570b1&logoWidth=40&style=flat-square)](https://github.com/sindresorhus/globals)
[![husky](https://img.shields.io/badge/husky-v9.1.7-2e81b8.svg?labelColor=333&cacheSeconds=3600&logo=husky&logoColor=2e81b8&logoWidth=40&style=flat-square)](https://github.com/typicode/husky)
[![jiti](https://img.shields.io/badge/jiti-v2.7.0-2ab746.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2ab746&logoWidth=40&style=flat-square)](https://github.com/unjs/jiti)
[![lint-staged](https://img.shields.io/badge/lint_staged-v17.3.0-dfba26.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dfba26&logoWidth=40&style=flat-square)](https://github.com/lint-staged/lint-staged)
[![npm-check-updates](https://img.shields.io/badge/npm_check_updates-v23.1.0-1ec23c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1ec23c&logoWidth=40&style=flat-square)](https://github.com/raineorshine/npm-check-updates)
[![rimraf](https://img.shields.io/badge/rimraf-v6.1.3-24a85b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=24a85b&logoWidth=40&style=flat-square)](https://github.com/isaacs/rimraf)
[![ts-unused-exports](https://img.shields.io/badge/ts_unused_exports-v11.0.1-5e26c0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=5e26c0&logoWidth=40&style=flat-square)](https://github.com/pinterest/ts-unused-exports)
[![tsup](https://img.shields.io/badge/tsup-v8.5.1-472cce.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=472cce&logoWidth=40&style=flat-square)](https://github.com/egoist/tsup)
[![typescript-eslint](https://img.shields.io/badge/typescript_eslint-v8.68.0-dc2e59.svg?labelColor=333&cacheSeconds=3600&logo=eslint&logoColor=dc2e59&logoWidth=40&style=flat-square)](https://github.com/typescript-eslint/typescript-eslint)
[![vitest](https://img.shields.io/badge/vitest-v4.1.11-80c026.svg?labelColor=333&cacheSeconds=3600&logo=vitest&logoColor=80c026&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)

</div>

<br>

<div align="center">

# PeerDependencies

[![@nestjs/common](https://img.shields.io/badge/_nestjs_common-v11.1.17-88de2b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=88de2b&logoWidth=40&style=flat)](https://github.com/nestjs/nest)
[![socket.io](https://img.shields.io/badge/socket_io-v4.8.1-2e42d6.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2e42d6&logoWidth=40&style=flat)](https://github.com/socketio/socket.io)
[![joi](https://img.shields.io/badge/joi-v18.0.2-9f1eb3.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=9f1eb3&logoWidth=40&style=flat)](https://github.com/sideway/joi)
[![fastify-socket.io](https://img.shields.io/badge/fastify_socket_io-v5.1.0-c54e30.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c54e30&logoWidth=40&style=flat)](https://github.com/ducktors/fastify-socket.io)

</div>
<!-- DEPBADGE:END -->

<br>

## Features

- **NestJS-native** — a dynamic module (`registerAsync`) wiring a `SocketIOService` to caller-supplied `SocketIOServerConfig`.
- **Adapter auto-detection** — `SocketIOModule.attach()` detects Fastify or Express and attaches Socket.IO accordingly.
- **Room management** — `joinRoom`/`leaveRoom` helpers plus `to`/`in`/`except` modifiers for targeted emission.
- **Fluent API** — every service method returns `this` for chaining (`to(room).emit(event, data)`).
- **Full server surface** — `emit`, `emitTo`, `on`, `timeout`, `fetchSockets`, `socketsJoin`, `socketsLeave`, `disconnectSockets`, `close`, `of`, `use`.

## Installation

```sh
pnpm add @triplef/socketio
```

For Fastify support:

```sh
pnpm add fastify-socket.io
```

## Usage

### Module setup

The library ships no env-driven config — supply the `SocketIOServerConfig`
through a factory, and validate it with the exported `SocketIOConfigSchema`.

```ts
import { SocketIOModule, SocketIOConfigSchema } from '@triplef/socketio';
import { ValidateReturnValue } from '@triplef/config-factory/validate-return-value';

@Module({
  imports: [
    SocketIOModule.registerAsync({
      global: true,
      inject: [MySocketIOConfigService],
      useFactory: (config: MySocketIOConfigService) => config.options,
    }),
  ],
})
export class AppModule {}
```

### Attaching the server

```ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SocketIOModule } from '@triplef/socketio';

void (async () => {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await SocketIOModule.attach(app);
  await app.listen({ port: 3000 });
})();
```

### Emitting events

```ts
import { SocketIOService } from '@triplef/socketio';

@Injectable()
export class NotificationsService {
  constructor(private readonly socketService: SocketIOService) {}

  notifyUser(userId: string, notification: unknown) {
    this.socketService.emitTo('notification', userId, notification);
  }

  notifyAll(notification: unknown) {
    this.socketService.emit('notification', notification);
  }
}
```

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt)

</div>
<br>
