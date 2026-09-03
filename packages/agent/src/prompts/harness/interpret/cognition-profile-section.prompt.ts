/** Cap on the rendered profile block, so a rich profile stays a cheap hint. */
const COGNITION_PROFILE_CHAR_LIMIT = 2000;

/**
 * Render the AI's cognition profile as a section for the intent classifier,
 * alongside the memory probe (facts) and episode probe (recent activity).
 * The profile is the accumulated, DERIVED understanding of the user (their
 * traits, standing interests, working context) — the third memory layer the
 * classifier weighs when resolving references and shaping tool choices.
 * Empty/blank input → undefined (no block).
 */
export function buildCognitionProfileSection(profileJson: string): string | undefined {
  const trimmed = profileJson.trim();
  if (!trimmed) return undefined;

  const capped =
    trimmed.length > COGNITION_PROFILE_CHAR_LIMIT ? `${trimmed.slice(0, COGNITION_PROFILE_CHAR_LIMIT)}…` : trimmed;

  return `COGNITION PROFILE — YOUR accumulated understanding of this user: your own derived conclusions (traits, interests, standing context), not their verbatim statements. Use it to resolve what the user is referring to and to shape tool choices; never treat it as the current request itself.
${capped}`;
}
