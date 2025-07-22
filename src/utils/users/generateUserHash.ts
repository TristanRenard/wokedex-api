import crypto from "crypto"

/**
 * Generate a hash for the user email, this hash have a very high entropy and can be used as a user id
 * @param email - The user email
 * @returns The hash
 */

const generateUserHash = (email: string): string => {
  const secret = process.env.USER_HASH_SECRET ?? "default-secret"

  return crypto.createHmac("sha256", secret)
    .update(email.toLowerCase().trim())
    .digest("hex")
}
export { generateUserHash }
