import { eq } from "drizzle-orm"
import { db } from "../../db/index.js"
import { type User, users } from "../../db/schema.js"

const getUserById = async (userId: string): Promise<User | null> => {
  const user = await db.select().from(users).where(eq(users.id, userId))

  return user.length > 0 ? user[0] : null
}

export default getUserById
