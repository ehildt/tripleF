---
'@triplef/agent': minor
'@triplef/memory': minor
'@triplef/dashboard': patch
---

Strict five-tier macro-taxonomy chain: cluster → community → hub → node → leaf (partition and encyclopedia lanes alike). The LLM contracts gain the named NODE tier below the hub (extraction, encyclopedia classify, remember tool, taxonomy probe) with all four chain labels mandatory — partial chains fail the schema and go through correction instead of entering the registry. Memory writes refuse incomplete chains after normalization; point payloads carry the new `node` field; `listLeaves` serves node (and tag) items. The dashboard drill follows the strict chain (hub view lists nodes, node/tag views show leaves) with a fifth harmony tint; the constellation renders node-tier aspect dots inside hub blobs (dot per distinct aspect, tinted in the topic color, registry meta attached) and leaf dots carry their node label. The preprocessing config is now strictly session-scoped server state: fetched on store construction (no boot idle-push), pushed immediately on change (no debounce), with the load echo guarded. NOTE: existing taxonomy data is incompatible — drop and rebuild.
