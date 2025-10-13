import { eq } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { users } from "../../db/schema.js"

const setUsername = async (
  hash: string,
  username: string,
  db = dbInstance,
): Promise<void> => {
  await db.update(users).set({ username }).where(eq(users.hash, hash))
}

export default setUsername
