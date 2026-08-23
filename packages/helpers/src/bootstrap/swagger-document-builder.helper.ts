import { DocumentBuilder } from '@nestjs/swagger';

import { readPackageJsonFromRoot } from './read-package-json-from-root.helper.ts';

const PACKAGE_JSON = readPackageJsonFromRoot();

export const SWAGGER_DOCUMENT = new DocumentBuilder()
  .setTitle(PACKAGE_JSON.name.toUpperCase())
  .setDescription(PACKAGE_JSON.description)
  .setVersion(PACKAGE_JSON.version)
  .build();
