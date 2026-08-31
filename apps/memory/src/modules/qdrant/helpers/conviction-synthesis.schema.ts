import { z } from 'zod';

/**
 * Structured template for the conviction-synthesis pass — the JSON contract
 * the model fills when synthesizing higher-level statements from a numbered
 * list of evidence facts. `evidence` holds ORDINAL indices into the
 * presented list (never raw point ids — the model cannot reproduce opaque
 * Qdrant hashes and must not be trusted to); the parser maps ordinals to
 * real ids and drops out-of-range citations.
 */
export const ConvictionSynthesisSchema = z.object({
  convictions: z
    .array(
      z.object({
        /** One self-contained sentence — a synthesis, never a restatement. */
        text: z.string(),
        /**
         * The lane this statement belongs to — forced choice:
         * `conviction` = a durable conclusion about the user/self model
         * (cognition lane); `bridge` = a synthesized claim that closes a
         * gap BETWEEN facts (partition lane, linked to its evidence).
         */
        target: z.enum(['conviction', 'bridge']),
        /** Ordinal indices into the EVIDENCE list that support this statement. */
        evidence: z.array(z.number().int().min(0)),
      }),
    )
    .max(20),
});

export type ConvictionSynthesis = z.infer<typeof ConvictionSynthesisSchema>;
