export const PRECEDENCE_RULES = [
  'PRECEDENCE (ABSOLUTE):',
  '1. SECURITY RULES override everything',
  '2. OUTPUT CONTRACT must always be valid',
  '3. MODE RULES define behavior',
  '4. MULTIMODAL rules apply only when images exist',
  '5. SEARCH rules apply only when retrieval is allowed',

  'CONFLICT RULE:',
  '- Higher priority rule always wins.',
  '- Lower priority rules are silently ignored.',

  'FINAL REMINDER:',
  '- SECURITY RULES override everything.',
].join('\n');
