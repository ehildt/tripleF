---
'@triplef/agent': patch
---

Contested-memory query contract for the gap-filling researcher: open frictions become resolution-seeking searches.

- **New schema:** `ResearchFrictionQuerySchema` / `ResearchFrictionQueryDecisionSchema` — the structured verdict the model fills per contested pair (`checkable`, optional resolution-seeking `query`).
- **New prompt:** `RESEARCH_FRICTION_QUERY_INSTRUCTIONS` + `buildResearchFrictionQueryPrompt` — decides which contradictions a web search can settle and formulates the evidence-seeking query; subjective disputes are declined and stay with the reflection cycle. Mirrors the research triage prompt style.
- **New prompt:** `buildSynopsisProbeSection` — renders the Raptor community-synopsis hits (cluster summaries at any hierarchy level) as an interpret-probe block, next to the fact probe, episode probe, and cognition profile.
