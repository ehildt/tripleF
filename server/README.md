<div align="center">

# @CKIR.IO/VISIONS — Server

A NestJS microservice for AI-powered image analysis using Ollama vision models. Supports image description, comparison, and OCR via REST API or MCP (Model Context Protocol) with JSON‑RPC 2.0 transport.

</div>

<br>

<!-- DEPBADGE:START -->
<div align="center">

![github](https://img.shields.io/github/release/ehildt/ckir.io-visions?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/stars/ehildt/ckir.io-visions?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/license/ehildt/ckir.io-visions?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
[![codecov](https://img.shields.io/codecov/c/github/ehildt/ckir.io-visions?labelColor=333&cacheSeconds=3600&logo=codecov&logoColor=4021b0&logoWidth=40&style=for-the-badge&color=4021b0&branch=main)](https://about.codecov.io/)

</div>

<br>

<div align="center">



# Dependencies

[![@ehildt/ckir-helpers](https://img.shields.io/badge/_ehildt_ckir_helpers-v1.5.0-a82947.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=a82947&logoWidth=40&style=flat-square)](https://github.com/ehildt/ckir-helpers)
[![@ehildt/nestjs-bullmq](https://img.shields.io/badge/_ehildt_nestjs_bullmq-v1.1.3-add91c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=add91c&logoWidth=40&style=flat-square)](https://github.com/ehildt/nestjs-bullmq)
[![@ehildt/nestjs-bullmq-logger](https://img.shields.io/badge/_ehildt_nestjs_bullmq_logger-v1.2.4-abdb1a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=abdb1a&logoWidth=40&style=flat-square)](https://github.com/ehildt/nestjs-bullmq-logger)
[![@ehildt/nestjs-config-factory](https://img.shields.io/badge/_ehildt_nestjs_config_factory-v1.1.2-a93cd7.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=a93cd7&logoWidth=40&style=flat-square)](https://github.com/ehildt/nestjs-config-factory)
[![@ehildt/nestjs-ollama](https://img.shields.io/badge/_ehildt_nestjs_ollama-v1.2.1-9bdb24.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=9bdb24&logoWidth=40&style=flat-square)](https://github.com/ehildt/nestjs-ollama)
[![@ehildt/nestjs-socket.io](https://img.shields.io/badge/_ehildt_nestjs_socket_io-v1.3.3-cebd22.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=cebd22&logoWidth=40&style=flat-square)](https://github.com/ehildt/nestjs-socket.io)
[![@fastify/compress](https://img.shields.io/badge/_fastify_compress-v8.3.1-c62478.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c62478&logoWidth=40&style=flat-square)](https://github.com/fastify/fastify-compress)
[![@fastify/multipart](https://img.shields.io/badge/_fastify_multipart-v9.4.0-3dd198.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=3dd198&logoWidth=40&style=flat-square)](https://github.com/fastify/fastify-multipart)
[![@fastify/static](https://img.shields.io/badge/_fastify_static-v9.1.3-8ab61b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=8ab61b&logoWidth=40&style=flat-square)](https://github.com/fastify/fastify-static)
[![@nestjs/axios](https://img.shields.io/badge/_nestjs_axios-v4.0.1-23c7bc.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=23c7bc&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/bullmq](https://img.shields.io/badge/_nestjs_bullmq-v11.0.4-69b927.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=69b927&logoWidth=40&style=flat-square)](https://github.com/nestjs/bullmq)
[![@nestjs/common](https://img.shields.io/badge/_nestjs_common-v11.1.19-88de2b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=88de2b&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/core](https://img.shields.io/badge/_nestjs_core-v11.1.19-4fc219.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4fc219&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/microservices](https://img.shields.io/badge/_nestjs_microservices-v11.1.19-4628bd.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4628bd&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/platform-fastify](https://img.shields.io/badge/_nestjs_platform_fastify-v11.1.19-33cc8f.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=33cc8f&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/swagger](https://img.shields.io/badge/_nestjs_swagger-v11.4.2-225fd8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=225fd8&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/terminus](https://img.shields.io/badge/_nestjs_terminus-v11.1.1-9b3dd6.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=9b3dd6&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![bullmq](https://img.shields.io/badge/bullmq-v5.76.2-e03a24.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e03a24&logoWidth=40&style=flat-square)](https://github.com/taskforcesh/bullmq)
[![class-transformer](https://img.shields.io/badge/class_transformer-v0.5.1-2bc59c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2bc59c&logoWidth=40&style=flat-square)](https://github.com/typestack/class-transformer)
[![class-validator](https://img.shields.io/badge/class_validator-v0.15.1-461ddd.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=461ddd&logoWidth=40&style=flat-square)](https://github.com/typestack/class-validator)
[![fastify](https://img.shields.io/badge/fastify-v5.8.5-29db88.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=29db88&logoWidth=40&style=flat-square)](https://github.com/fastify/fastify)
[![ioredis](https://img.shields.io/badge/ioredis-v5.10.1-b0219a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b0219a&logoWidth=40&style=flat-square)](https://github.com/luin/ioredis)
[![joi](https://img.shields.io/badge/joi-v18.1.2-9f1eb3.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=9f1eb3&logoWidth=40&style=flat-square)](https://github.com/sideway/joi)
[![npm](https://img.shields.io/badge/npm-v11.13.0-2466ae.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2466ae&logoWidth=40&style=flat-square)](https://github.com/npm/cli)
[![ollama](https://img.shields.io/badge/ollama-v0.6.3-e0481a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e0481a&logoWidth=40&style=flat-square)](https://github.com/ollama/ollama)
[![pino](https://img.shields.io/badge/pino-v10.3.1-2fc15b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2fc15b&logoWidth=40&style=flat-square)](https://github.com/pinojs/pino)
[![pino-pretty](https://img.shields.io/badge/pino_pretty-v13.1.3-28acb8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28acb8&logoWidth=40&style=flat-square)](https://github.com/pinojs/pino-pretty)
[![reflect-metadata](https://img.shields.io/badge/reflect_metadata-v0.2.2-2489db.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2489db&logoWidth=40&style=flat-square)](https://github.com/rbuckton/reflect-metadata)
[![rxjs](https://img.shields.io/badge/rxjs-v7.8.2-256cd0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=256cd0&logoWidth=40&style=flat-square)](https://github.com/reactivex/rxjs)
[![sharp](https://img.shields.io/badge/sharp-v0.34.5-b72e2a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b72e2a&logoWidth=40&style=flat-square)](https://github.com/lovell/sharp)

</div>

<br>

<div align="center">



# DevDependencies

[![@eslint/js](https://img.shields.io/badge/_eslint_js-v10.0.1-7a23a9.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=7a23a9&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@nestjs/cli](https://img.shields.io/badge/_nestjs_cli-v11.0.21-2dc8ae.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2dc8ae&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/schematics](https://img.shields.io/badge/_nestjs_schematics-v11.1.0-d01b6f.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d01b6f&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@nestjs/testing](https://img.shields.io/badge/_nestjs_testing-v11.1.19-c02635.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c02635&logoWidth=40&style=flat-square)](https://github.com/nestjs/nest)
[![@types/eslint](https://img.shields.io/badge/_types_eslint-v9.6.1-d936d0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d936d0&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/node](https://img.shields.io/badge/_types_node-v25.6.0-d51a33.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d51a33&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/supertest](https://img.shields.io/badge/_types_supertest-v7.2.0-b41882.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b41882&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@vitest/coverage-v8](https://img.shields.io/badge/_vitest_coverage_v8-v4.1.5-92d435.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=92d435&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![depcheck](https://img.shields.io/badge/depcheck-v1.4.7-28a95e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28a95e&logoWidth=40&style=flat-square)](https://github.com/depcheck/depcheck)
[![dependency-cruiser](https://img.shields.io/badge/dependency_cruiser-v17.3.10-c22431.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c22431&logoWidth=40&style=flat-square)](https://github.com/sverweij/dependency-cruiser)
[![dotenv-cli](https://img.shields.io/badge/dotenv_cli-v11.0.0-d53074.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d53074&logoWidth=40&style=flat-square)](https://github.com/entropia/dotenv-cli)
[![eslint](https://img.shields.io/badge/eslint-v10.2.1-3f2ab7.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=3f2ab7&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![eslint-config-prettier](https://img.shields.io/badge/eslint_config_prettier-v10.1.8-c4921c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c4921c&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-config-prettier)
[![eslint-plugin-prettier](https://img.shields.io/badge/eslint_plugin_prettier-v5.5.5-d19d2e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d19d2e&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-plugin-prettier)
[![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint_plugin_simple_import_sort-v12.1.1-39d025.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=39d025&logoWidth=40&style=flat-square)](https://github.com/lydell/eslint-plugin-simple-import-sort)
[![eslint-plugin-sonarjs](https://img.shields.io/badge/eslint_plugin_sonarjs-v4.0.3-ca216a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ca216a&logoWidth=40&style=flat-square)](https://github.com/SonarSource/eslint-plugin-sonarjs)
[![globals](https://img.shields.io/badge/globals-v17.5.0-2570b1.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2570b1&logoWidth=40&style=flat-square)](https://github.com/sindresorhus/globals)
[![husky](https://img.shields.io/badge/husky-v9.1.7-2e81b8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2e81b8&logoWidth=40&style=flat-square)](https://github.com/typicode/husky)
[![jiti](https://img.shields.io/badge/jiti-v2.6.1-2ab746.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2ab746&logoWidth=40&style=flat-square)](https://github.com/unjs/jiti)
[![lint-staged](https://img.shields.io/badge/lint_staged-v16.4.0-dfba26.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dfba26&logoWidth=40&style=flat-square)](https://github.com/lint-staged/lint-staged)
[![npm-check-updates](https://img.shields.io/badge/npm_check_updates-v20.0.2-1ec23c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1ec23c&logoWidth=40&style=flat-square)](https://github.com/raineorshine/npm-check-updates)
[![rimraf](https://img.shields.io/badge/rimraf-v6.1.3-24a85b.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=24a85b&logoWidth=40&style=flat-square)](https://github.com/isaacs/rimraf)
[![source-map-support](https://img.shields.io/badge/source_map_support-v0.5.21-2ecc39.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2ecc39&logoWidth=40&style=flat-square)](https://github.com/evanw/source-map-support)
[![supertest](https://img.shields.io/badge/supertest-v7.2.2-de21a8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=de21a8&logoWidth=40&style=flat-square)](https://github.com/visionmedia/supertest)
[![ts-loader](https://img.shields.io/badge/ts_loader-v9.5.7-1e46be.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1e46be&logoWidth=40&style=flat-square)](https://github.com/TypeStrong/ts-loader)
[![ts-node](https://img.shields.io/badge/ts_node-v10.9.2-c51b76.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c51b76&logoWidth=40&style=flat-square)](https://github.com/TypeStrong/ts-node)
[![ts-unused-exports](https://img.shields.io/badge/ts_unused_exports-v11.0.1-5e26c0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=5e26c0&logoWidth=40&style=flat-square)](https://github.com/pinterest/ts-unused-exports)
[![tsconfig-paths](https://img.shields.io/badge/tsconfig_paths-v4.2.0-a025d4.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=a025d4&logoWidth=40&style=flat-square)](https://github.com/david-driscoll/tsconfig-paths)
[![typescript](https://img.shields.io/badge/typescript-v5.9.3-4c2eb8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4c2eb8&logoWidth=40&style=flat-square)](https://github.com/Microsoft/TypeScript)
[![typescript-eslint](https://img.shields.io/badge/typescript_eslint-v8.59.0-dc2e59.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dc2e59&logoWidth=40&style=flat-square)](https://github.com/typescript-eslint/typescript-eslint)
[![vitest](https://img.shields.io/badge/vitest-v4.1.5-80c026.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=80c026&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)

</div>
<!-- DEPBADGE:END -->

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/ckir.io-visions/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/ckir.io-visions/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt) &nbsp;—&nbsp; [AI GUIDANCE](https://github.com/ehildt/ckir.io-visions/wiki/ai-guidance)

</div>

<br>
