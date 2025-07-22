import { sql } from "drizzle-orm"
import { testDb } from "./setup.js"

/**
 * Clean the database
 */
export const cleanDatabase = async (): Promise<void> => {
  await testDb.execute(sql`
    TRUNCATE TABLE users 
    RESTART IDENTITY 
    CASCADE
  `)
}
