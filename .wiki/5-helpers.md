# 5. Helpers: The @triplef/helpers Library

A shared utility library providing helper functions for the tripleF project. `@triplef/helpers` is published to npm as an **ESM-only** package.

> This library is **ESM-only** and does not support CommonJS. Your project must use ES modules.

## Modules

| Module | Description |
| --- | --- |
| [5.1. Bootstrap](5.1-bootstrap.md) | NestJS app configuration, validation pipeline, swagger setup, logging |
| [5.2. Environment Variables](5.2-environment-variables.md) | Parse environment variables as boolean or numeric values |
| [5.3. Find Up](5.3-find-up.md) | Recursively search for a file by traversing up the directory tree |
| [5.4. Hash Payload](5.4-hash-payload.md) | Generate cryptographic hashes (SHA-256, SHA-384, SHA-512) |
| [5.5. Is Buffer or Serialized](5.5-is-buffer-or-serialized.md) | Cross-platform buffer detection (Buffer, ArrayBuffer, TypedArray, DataView, serialized) |
| [5.6. Object I/O](5.6-object-io.md) | Clone, merge, pick, omit, and check objects for emptiness |
| [5.7. Text To Lines](5.7-text-to-lines.md) | Split text into sentences (Western and CJK punctuation) |
| [5.9. Retry With Backoff](5.9-retry-with-backoff.md) | Exponential-backoff retries with jitter, abort, and predicates |
| [5.10. Parse LLM JSON](5.10-parse-llm-json.md) | Tolerant parsing of model-emitted JSON |
| [5.11. Limit Text](5.11-limit-text.md) | Cap LLM-facing text with an explicit truncation marker |
| [5.12. Mask API Key](5.12-mask-api-key.md) | Fixed-mask API-key display + masked-value detection |
| [5.13. Encrypt Secret](5.13-encrypt-secret.md) | AES-256-GCM encrypt/decrypt with versioned, fingerprinted payloads |
| [5.14. Key Fingerprint](5.14-key-fingerprint.md) | Stable non-sensitive key identifier (SHA-256 prefix) |

## Installation

```bash
npm install @triplef/helpers
```

## Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install @nestjs/common @nestjs/swagger joi
```
