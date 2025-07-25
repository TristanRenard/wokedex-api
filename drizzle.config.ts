import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // @ts-expect-error - envURI is not typed
    connectionString: process.env.DATABASE_URL
  }
})