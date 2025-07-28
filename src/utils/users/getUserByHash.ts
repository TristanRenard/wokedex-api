import { eq } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { type User, users } from "../../db/schema.js"

const getUserByHash = async (hash: string, db = dbInstance): Promise<User> => {
  const user = await db.select().from(users).where(eq(users.hash, hash))

  return user[0]
}

export default getUserByHash
