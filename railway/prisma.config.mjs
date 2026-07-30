// Minimal Prisma config for the boot-time schema sync (`prisma db push`)
// inside the all-in-one Railway image. Plain ESM on purpose: the repo's
// prisma.config.ts imports 'prisma/config', which a global prisma CLI
// cannot resolve outside the workspace — this file has no imports.
export default {
  schema: 'prisma/schema.prisma',
  datasource: { url: process.env.POSTGRES_URL },
};
