---
'@triplef/agent': patch
---

Encyclopedia classify prompt: the topic is the document's main subject entity.

- **Prompt tightening:** the topic rule now pins classification to the title-level entity (never a sub-part — a chapter, location, single feature — and never an adjacent proper noun like a publisher or related event), and the category labels the topic's family rather than any side theme. Reduces taxonomy drift where a chunk about one district or one corporate announcement would mint its own topic/category instead of joining the document's main subject (observed live: "travel" / "hethereau districts" fragments next to "games" / "neverness to everness").
