import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { afterAll, beforeAll } from "vitest"
import * as schema from "../db/schema.js"
import { cleanDatabase } from "./helper.js"

let container: StartedPostgreSqlContainer =
  undefined as unknown as StartedPostgreSqlContainer
let pool: Pool = undefined as unknown as Pool
export let testDb: ReturnType<typeof drizzle> =
  undefined as unknown as ReturnType<typeof drizzle>

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:15-alpine")
    .withDatabase("testdb")
    .withUsername("testuser")
    .withPassword("testpass")
    .withExposedPorts(5432)
    .withStartupTimeout(120_000)
    .start()

  const connectionString = container.getConnectionUri()

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  testDb = drizzle(pool, { schema })

  await migrate(testDb, { migrationsFolder: "./drizzle" })
}, 150_000)

afterAll(async () => {
  await cleanDatabase()

  if (pool) {
    await pool.end()
  }

  if (container) {
    await container.stop()
  }
}, 30_000)
