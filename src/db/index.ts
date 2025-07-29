import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema.js"

config()

const connectionString =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, { schema })
