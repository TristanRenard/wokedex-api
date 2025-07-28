import { db as dbInstance } from "../db/index.js"
import type { UnpreparedUser } from "../types/user.js"
import umami from "../umami.js"
import createToken from "../utils/users/createToken.js"
import { createUser } from "../utils/users/createUser.js"
import { generateUserHash } from "../utils/users/generateUserHash.js"
import getUserByHash from "../utils/users/getUserByHash.js"

const loginController = async (
  { email, username }: UnpreparedUser,
  db = dbInstance,
): Promise<string | void> => {
  try {
    await umami.track("login_controller_started", {
      email: email ? "provided" : "missing",
    })

    const userHash = await generateUserHash(email)
    await umami.track("user_hash_generated")

    const existingUser = await getUserByHash(userHash, db)

    if (existingUser) {
      await umami.track("existing_user_found")
    } else {
      await umami.track("new_user_created")
    }

    const user = existingUser ?? (await createUser({ email, username }, db))

    if (user) {
      const { verificationToken } = await createToken(user.hash, db)
      await umami.track("verification_token_created", { success: "true" })

      return verificationToken
    }

    await umami.track("login_controller_failed", {
      reason: "user_creation_failed",
    })

    return undefined
  } catch (error) {
    await umami.track("login_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default loginController
