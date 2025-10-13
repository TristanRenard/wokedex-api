import crypto from "crypto"
import umami from "../../umami.js"

/**
 * Generate a hash for the user email, this hash have a very high entropy and can be used as a user id
 * @param email - The user email
 * @returns The hash
 */

const generateUserHash = async (email: string): Promise<string> => {
  try {
    await umami.track("generate_user_hash_started", {
      hasEmail: email ? "true" : "false",
    })

    const secret = process.env.USER_HASH_SECRET ?? "default-secret"
    const userHash = crypto
      .createHmac("sha256", secret)
      .update(email.toLowerCase().trim())
      .digest("hex")

    await umami.track("generate_user_hash_completed")

    return userHash
  } catch (error) {
    await umami.track("generate_user_hash_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}
export { generateUserHash }
