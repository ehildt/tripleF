import { Logger } from '@nestjs/common';

export function logConfigObject(logger: Logger, factory: Record<string, unknown>, printConfig = false) {
  if (printConfig)
    logger.log(Object.keys(factory).reduce((obj, key) => Object.assign(obj, { [key.slice(1)]: factory[key] }), {}));
}
