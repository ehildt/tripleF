/**
 * Minimal source-policy shape the prompt needs — the server's SourcesConfig
 * satisfies it structurally, so the prompt stays decoupled from app config.
 */
export interface SourcePolicyConfig {
  preferred?: string[];
  blocked?: string[];
}
