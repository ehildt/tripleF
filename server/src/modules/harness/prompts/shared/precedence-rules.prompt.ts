export const PRECEDENCE_RULES = `PRECEDENCE (ABSOLUTE):
1. LANGUAGE RULE
2. SECURITY RULES
3. OUTPUT CONTRACT
4. MODE RULES
5. MULTIMODAL rules apply only when images exist
6. SEARCH rules apply only when retrieval is allowed

CONFLICT RULE:
- Higher priority rule always wins.
- Lower priority rules are silently ignored.`;
