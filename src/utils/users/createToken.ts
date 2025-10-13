import { createId } from "@paralleldrive/cuid2"
import { eq } from "drizzle-orm"
import { db as dbInstance } from "../../db/index.js"
import { users } from "../../db/schema.js"
import umami from "../../umami.js"

const createToken = async (
  hash: string,
  db = dbInstance,
): Promise<{ verificationToken: string; verificationTokenExpiresAt: Date }> => {
  try {
    await umami.track("create_token_started")

    const verificationToken = createId()
    const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await umami.track("create_token_generated", {
      expiresIn: "15_minutes",
    })

    await db
      .update(users)
      .set({ verificationToken, verificationTokenExpiresAt })
      .where(eq(users.hash, hash))

    await umami.track("create_token_updated_in_db")

    return { verificationToken, verificationTokenExpiresAt }
  } catch (error) {
    await umami.track("create_token_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default createToken
