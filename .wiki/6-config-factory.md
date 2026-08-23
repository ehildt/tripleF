# 6. Config-Factory: The @triplef/config-factory Library

A NestJS configuration library providing decorators and modules for caching return values and validating configurations. `@triplef/config-factory` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

## Modules

| Module | Description |
| --- | --- |
| [6.1. Config-Factory Module](6.1-config-factory.md) | NestJS module for registering configuration providers |
| [6.2. Cache Return Value](6.2-cache-return-value.md) | Decorator that caches method/getter return values with optional Joi validation |
| [6.3. Validate Return Value](6.3-validate-return-value.md) | Decorator that validates method/getter return values against a Joi schema |

## Installation

```bash
npm install @triplef/config-factory
```

## Peer Dependencies

```bash
npm install @triplef/helpers @nestjs/common joi
```
