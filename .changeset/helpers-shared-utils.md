---
'@triplef/helpers': minor
---

Add six shared helper modules extracted from the server and memory apps:

- `mask-api-key` — `maskApiKey`, `isMaskedApiKey`
- `retry-with-backoff` — `retryWithBackoff` (+ `RetryWithBackoffOptions`)
- `decrypt-secret` — `decryptSecret`
- `encrypt-secret` — `encryptSecret`
- `key-fingerprint` — `keyFingerprint`
- `parse-llm-json` — `parseLlmJson`

Adds `json5` as a runtime dependency.
