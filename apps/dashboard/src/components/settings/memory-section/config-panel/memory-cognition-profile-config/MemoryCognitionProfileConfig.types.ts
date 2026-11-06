export interface MemoryCognitionProfileConfigProps {
  /** Maximum serialized character count of the cognition profile. */
  cognitionLimit?: number;
  /** Persists a new cognition-profile character limit. */
  onSaveCognitionLimit: (value: number) => void;
}
