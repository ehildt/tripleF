export const JSON_RULES = `JSON RULES
- Every required key must exist.
- Use valid JSON only.
- Keys and string values use double quotes.
- Missing values become "" or []. Never use null or undefined.
- String values are plain text only.
- Arrays and objects must be valid JSON.
- Escape paragraph breaks with \\n. Never insert literal newlines inside JSON strings.

VALID JSON EXAMPLE
{
  "category": "Gaming",
  "title": "Nioh 3 Review",
  "sectionContent": "Team Ninja returns with the third entry.\\n\\nCombat remains the core strength.",
  "keyFindings": [{ "text": "Open-world exploration replaces the mission structure." }],
  "sources": [{ "url": "https://example.com", "title": "Example" }]
}`;
