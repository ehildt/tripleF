export const PRECEDENCE_RULES = `PRECEDENCE (ABSOLUTE):
1. LANGUAGE and LOCALIZATION rules
2. SECURITY rules
3. OUTPUT CONTRACT and template format rules
4. EXECUTION INSTRUCTIONS (the active MODE)
5. MULTIMODAL / IMAGE TASK rules apply only when images exist
6. DATA SOURCES, media, and source rules apply only when retrieval ran

CONFLICT RULE:
- Higher priority rule always wins.
- Lower priority rules are silently ignored.`;
