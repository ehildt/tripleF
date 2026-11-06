export interface MemorySpacesConfigProps {
  /** Currently selected cognition-space key; an empty string selects the default. */
  memoryCognition: string;
  /** Previously used cognition-space keys, most recently used first. */
  memoryCognitionSpaces: string[];
  /** Called when an existing cognition space is selected. */
  onSelectMemoryCognition: (space: string) => void;
  /** Called when a new cognition-space key is created and selected. */
  onCreateMemoryCognition: (space: string) => void;
  /** Called when a cognition-space key is removed from the history. */
  onRemoveMemoryCognitionSpace: (space: string) => void;
}
