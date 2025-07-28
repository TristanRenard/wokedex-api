import { eq } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { users, type User } from "../../db/schema.js"

const getUserByVerificationToken = async (
  verificationToken: string,
  db = dbInstance,
): Promise<User | null> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, verificationToken))

  return user ?? null
}

export default getUserByVerificationToken
