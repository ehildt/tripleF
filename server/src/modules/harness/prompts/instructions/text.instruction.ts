export const TEXT_INSTRUCTIONS = [
  'MODE: TEXT',
  '',
  'Goal: answer the user directly.',
  '',
  'Required JSON format:',
  '{ "text": "your plain-text answer here" }',
  '',
  'Rules:',
  '- The value of "text" must be your full answer.',
  '- Use line breaks and simple punctuation for structure.',
  '- No markdown, no HTML, no code fences.',
  '- Do not include any other keys.',

  'FINAL REMINDER:',
  '- Return exactly { "text": "your full plain-text answer" } with no markdown, HTML, code fences, or extra keys.',
].join('\n');
