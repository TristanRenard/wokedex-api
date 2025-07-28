import { eq } from "drizzle-orm"
import { db as dbInstance } from "../db/index.js"
import { users } from "../db/schema.js"
import umami from "../umami.js"
import generateJWT from "../utils/users/generateJWT.js"
import getUserByVerificationToken from "../utils/users/getUserByVerificationToken.js"
import setUsername from "../utils/users/setUsername.js"

const verifyController = async (
  username: string,
  verificationToken: string,
  db = dbInstance,
): Promise<string> => {
  try {
    await umami.track("verify_controller_started", {
      hasUsername: username ? "true" : "false",
      hasToken: verificationToken ? "true" : "false",
    })

    if ((!username && !verificationToken) || !verificationToken) {
      await umami.track("verify_controller_validation_failed", {
        reason: "missing_required_fields",
      })
      throw new Error("Username and verificationToken are required")
    }

    const user = await getUserByVerificationToken(verificationToken, db)

    if (!user) {
      await umami.track("verify_controller_user_not_found")
      throw new Error("User not found")
    }

    await umami.track("verify_controller_user_found")

    if (!user.verifiedAt) {
      await umami.track("verify_controller_user_not_verified")
      throw new Error("User cannot be verified")
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      await umami.track("verify_controller_token_expired")
      throw new Error("Verification token expired")
    }

    if (username) {
      await umami.track("verify_controller_setting_username")
      await setUsername(user.hash, username, db)
    }

    const jwt = await generateJWT(user.hash)

    if (!jwt) {
      await umami.track("verify_controller_jwt_generation_failed")
      throw new Error("JWT generation failed")
    }

    await umami.track("verify_controller_jwt_generated")

    await db
      .update(users)
      .set({
        verifiedAt: new Date(),
        verificationTokenExpiresAt: null,
        verificationToken: null,
      })
      .where(eq(users.hash, user.hash))

    await umami.track("verify_controller_success", {
      userUpdated: "true",
    })

    return jwt
  } catch (error) {
    await umami.track("verify_controller_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default verifyController
