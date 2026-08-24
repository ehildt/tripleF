import { Injectable, Logger } from '@nestjs/common';
import { decryptSecret } from '@triplef/helpers/decrypt-secret';
import { encryptSecret } from '@triplef/helpers/encrypt-secret';
import { keyFingerprint } from '@triplef/helpers/key-fingerprint';

import { SecretsConfigService } from '../configs/secrets-config.service.js';

/**
 * AES-256-GCM cipher for provider API keys persisted in the database. The
 * master keys come from the environment (OWASP separation of keys and
 * data): TRIPLEF_SECRETS_KEY encrypts and decrypts, the optional
 * TRIPLEF_SECRETS_KEY_PREVIOUS only decrypts payloads written before a
 * rotation. Without an active key the cipher is disabled and callers skip
 * persisting secrets — never a silent plaintext fallback.
 */
@Injectable()
export class SecretsCipherService {
  private readonly logger = new Logger(SecretsCipherService.name);
  private readonly activeKey: Buffer | null = null;
  private readonly keysByFingerprint = new Map<string, Buffer>();

  constructor(config: SecretsConfigService) {
    const { activeKey, previousKey } = config.config;
    if (activeKey) {
      this.activeKey = Buffer.from(activeKey, 'hex');
      this.keysByFingerprint.set(
        keyFingerprint(this.activeKey),
        this.activeKey,
      );
    }
    if (previousKey) {
      const previous = Buffer.from(previousKey, 'hex');
      this.keysByFingerprint.set(keyFingerprint(previous), previous);
    }
    if (!this.activeKey) {
      this.logger.warn(
        'TRIPLEF_SECRETS_KEY is not set — provider API keys will not be persisted',
      );
    }
  }

  isEnabled(): boolean {
    return this.activeKey !== null;
  }

  /**
   * Encrypt a secret with the active key. Returns undefined when the cipher
   * is disabled or the value is empty — callers drop the field then.
   */
  encrypt(plaintext: string): string | undefined {
    if (!this.activeKey || !plaintext) return undefined;
    return encryptSecret(plaintext, this.activeKey);
  }

  /**
   * Decrypt a payload with whichever known key produced it. Returns null on
   * any failure (malformed, unknown key, tampered data) so callers can drop
   * the value and continue booting instead of crashing.
   */
  decrypt(payload: string): string | null {
    try {
      return decryptSecret(payload, this.keysByFingerprint);
    } catch (error) {
      this.logger.warn(
        `Failed to decrypt a stored secret: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * True when the payload was encrypted with a retired key and should be
   * re-encrypted with the active key (lazy rotation on next persist).
   */
  needsReEncryption(payload: string): boolean {
    if (!this.activeKey) return false;
    const fingerprint = payload.split('.')[1];
    return !!fingerprint && fingerprint !== keyFingerprint(this.activeKey);
  }

  /** The active key's fingerprint (used by callers to detect unknown keys). */
  activeFingerprint(): string | null {
    return this.activeKey ? keyFingerprint(this.activeKey) : null;
  }
}
