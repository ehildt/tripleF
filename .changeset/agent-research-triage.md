---
'@triplef/agent': minor
---

Encyclopedia research triage contract for the gap-filling maintenance job.

- **New schema:** `ResearchTriageSchema` / `ResearchTriageDecisionSchema` — the structured verdict the research job's LLM fills per gap candidate (`close`, `reason`, optional `followUpTopics` for the next deep-dive).
- **New prompt:** `RESEARCH_TRIAGE_INSTRUCTIONS` + `buildResearchTriagePrompt` — the triage system/user prompt pair, mirroring the cluster-summary prompt style.
- **New export:** `extractArticleText` (web-fetch helper) is now public so the memory app's research job can reuse the same readability/turndown extraction as the web-fetch tool.
