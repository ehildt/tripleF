---
'@triplef/socketio': major
---

Initial release of the Socket.IO NestJS module:

- `SocketIOModule` — a dynamic module (`registerAsync`) wiring the service to caller-supplied `SocketIOServerConfig`, plus an `attach()` helper that auto-detects Fastify or Express.
- `SocketIOService` — a fluent service for room management and event handling (`emit`, `emitTo`, `on`, `to`/`in`/`except`, `timeout`, `fetchSockets`, `socketsJoin`/`socketsLeave`, `disconnectSockets`, `close`, `of`, `use`).
- `SocketIOConfigSchema` — an exported Joi schema for validating `SocketIOServerConfig`.
