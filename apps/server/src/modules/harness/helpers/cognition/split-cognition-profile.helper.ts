/**
 * Split a parsed cognition profile into the AI's own fields (persona,
 * corrections) and the user-side model. The AI-side fields are injected with
 * a distinct "YOUR IDENTITY" framing, never inside the "model of this user"
 * block — otherwise the model reads its own name as the user's data.
 */
export function splitCognitionProfile(
  profile: Record<string, unknown> | undefined,
): {
  persona?: Record<string, unknown>;
  corrections?: Record<string, unknown>;
  userProfile?: Record<string, unknown>;
} {
  if (!profile) return {};

  const { persona, corrections, ...userSide } = profile;

  return {
    persona: isNonEmptyObject(persona) ? persona : undefined,
    corrections: isNonEmptyObject(corrections) ? corrections : undefined,
    userProfile: Object.keys(userSide).length > 0 ? userSide : undefined,
  };
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}
