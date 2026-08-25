---
'@triplef/server': minor
---

- **Document conversion service**: converts fetched documents (PDF/HTML/text) into markdown for the lexicon pipeline.
- **Memory client**: wired for lexicon persistence, relink, and cognition endpoints; removed the qdrant/memory-overrides proxy controllers.
- **Minio service**: object-store support for document/media storage.
