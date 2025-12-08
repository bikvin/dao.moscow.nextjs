import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    // optionally shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
  // migrations: { path: 'prisma/migrations' }, // if you customize
  // other config...
})
