export interface ExtractedShownMediaKeys {
  /** Prefixed image keys: `fp:<fingerprint>` or `sh:<storage hash>`. */
  imageKeys: string[];
  /** Canonical video keys from videoUrlKeys. */
  videoKeys: string[];
}

export interface ShownMediaKeySourceOptions {
  /** User-upload storage URLs — uploads are never recorded as shown search media. */
  localImageUrls: Set<string>;
  /** Fingerprint lookup for this turn's ingested cloud images, keyed by storage URL. */
  fingerprintByStorageUrl: Map<string, string>;
}
