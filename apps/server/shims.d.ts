import type { Multipart, MultipartFile } from "@fastify/multipart";

import "jest-extended";
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    parts?: () => AsyncIterableIterator<Multipart>;
    file?: () => Promise<MultipartFile>;
  }
}
