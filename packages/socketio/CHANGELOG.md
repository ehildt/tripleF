# @triplef/socketio

## 1.0.3

### Patch Changes

- 5a7ab35: Switch all first-party code to the PolyForm Strict License 1.0.0. Noncommercial use remains permitted for individuals, companies, and other organizations, but modification, redistribution, and commercial use require separate permission from the copyright holder.

  Update package license metadata, license badges, project descriptions, and contribution guidance to match. Third-party dependencies remain subject to their original licenses. Versions previously released under MIT or AGPL terms remain available under those terms.

## 1.0.0

### Major Changes

- ec0d0a5: Initial release of the Socket.IO NestJS module:

  - `SocketIOModule` — a dynamic module (`registerAsync`) wiring the service to caller-supplied `SocketIOServerConfig`, plus an `attach()` helper that auto-detects Fastify or Express.
  - `SocketIOService` — a fluent service for room management and event handling (`emit`, `emitTo`, `on`, `to`/`in`/`except`, `timeout`, `fetchSockets`, `socketsJoin`/`socketsLeave`, `disconnectSockets`, `close`, `of`, `use`).
  - `SocketIOConfigSchema` — an exported Joi schema for validating `SocketIOServerConfig`.
