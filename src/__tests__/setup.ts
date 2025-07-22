/* eslint-disable no-console */
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql"
// eslint-disable-next-line no-duplicate-imports
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { afterAll, beforeAll } from "vitest"
import * as schema from "../db/schema.js"
import { cleanDatabase } from "./helper.js"

let container: StartedPostgreSqlContainer = undefined as unknown as StartedPostgreSqlContainer
let pool: Pool = undefined as unknown as Pool
export let testDb: ReturnType<typeof drizzle> = undefined as unknown as ReturnType<typeof drizzle>

beforeAll(async () => {
  console.log("🐳 Starting PostgreSQL container...")

  container = await new PostgreSqlContainer("postgres:15-alpine")
    .withDatabase("testdb")
    .withUsername("testuser")
    .withPassword("testpass")
    .withExposedPorts(5432)
    .withStartupTimeout(120_000)
    .start()

  console.log(`📦 Container started on port ${container.getMappedPort(5432)}`)

  const connectionString = container.getConnectionUri()
  console.log("🔌 Connecting to database...")

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  testDb = drizzle(pool, { schema })

  console.log("📋 Running migrations...")
  await migrate(testDb, { migrationsFolder: "./drizzle" })

  console.log("✅ Test database ready!")
}, 150_000)

afterAll(async () => {
  console.log("🧹 Cleaning up test resources...")
  await cleanDatabase()

  if (pool) {
    await pool.end()
    console.log("💾 Database pool closed")
  }

  if (container) {
    await container.stop()
    console.log("🐳 Container stopped")
  }
}, 30_000)