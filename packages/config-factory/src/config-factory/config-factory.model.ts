import { Provider } from '@nestjs/common';

/**
 * Options for configuring the ConfigFactoryModule.
 */
export interface ConfigFactoryOptions {
  /**
   * Whether to register the module as global.
   * Global modules are available to all other modules without explicit import.
   * @default false
   */
  global?: boolean;
  /**
   * Array of configuration provider classes to register.
   * These providers will be exported for use by other modules.
   */
  providers?: Array<Provider>;
}
