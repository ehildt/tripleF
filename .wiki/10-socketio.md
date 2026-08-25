# 10. Socket.IO: The @triplef/socketio Library

A NestJS module for building real-time applications with Socket.IO — room management, event handling, and a fluent emission API with Fastify/Express auto-detection. `@triplef/socketio` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

## Modules

| Module | Description |
| --- | --- |
| [10.1. Socket.IO Module](10.1-socket-io-module.md) | Dynamic module (`registerAsync`) + `attach()` adapter auto-detection |
| [10.2. Socket.IO Service](10.2-socket-io-service.md) | Fluent service for room management and event handling |
| [10.3. Socket.IO Schema](10.3-socket-io-schema.md) | Joi schema for validating `SocketIOServerConfig` |

## Installation

```bash
npm install @triplef/socketio
```

## Peer Dependencies

```bash
npm install @nestjs/common fastify-socket.io joi socket.io
```
