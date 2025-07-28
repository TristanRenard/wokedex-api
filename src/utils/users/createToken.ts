import { createId } from "@paralleldrive/cuid2"
import { eq } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { users } from "../../db/schema.js"

const createToken = async (
  hash: string,
  db = dbInstance,
): Promise<{ verificationToken: string; verificationTokenExpiresAt: Date }> => {
  const verificationToken = createId()
  const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await db
    .update(users)
    .set({ verificationToken, verificationTokenExpiresAt })
    .where(eq(users.hash, hash))

  return { verificationToken, verificationTokenExpiresAt }
}

export default createToken
