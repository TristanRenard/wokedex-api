import { eq } from "drizzle-orm"
import { db as dbInstance } from "../db/index.js"
import { users } from "../db/schema.js"
import generateJWT from "../utils/users/generateJWT.js"
import getUserByVerificationToken from "../utils/users/getUserByVerificationToken.js"
import setUsername from "../utils/users/setUsername.js"

const verifyController = async (
  username: string,
  verificationToken: string,
  db = dbInstance,
): Promise<string> => {
  if ((!username && !verificationToken) || !verificationToken) {
    throw new Error("Username and verificationToken are required")
  }

  const user = await getUserByVerificationToken(verificationToken, db)

  if (!user) {
    throw new Error("User not found")
  }

  if (!user.verifiedAt) {
    throw new Error("User cannot be verified")
  }

  if (
    user.verificationTokenExpiresAt &&
    user.verificationTokenExpiresAt < new Date()
  ) {
    throw new Error("Verification token expired")
  }

  if (username) {
    await setUsername(user.hash, username, db)
  }

  const jwt = generateJWT(user.hash)

  if (!jwt) {
    throw new Error("JWT generation failed")
  }

  await db
    .update(users)
    .set({
      verifiedAt: new Date(),
      verificationTokenExpiresAt: null,
      verificationToken: null,
    })
    .where(eq(users.hash, user.hash))

  return jwt
}

export default verifyController
