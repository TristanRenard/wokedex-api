import { db as dbInstance } from "../../db/index.js"

import type { NewUser } from "../../db/schema.js"
// eslint-disable-next-line no-duplicate-imports
import { users } from "../../db/schema.js"
import type { UnpreparedUser } from "../../types/user.js"
import { generateUserHash } from "./generateUserHash.js"

/**
 * Create a new user in the database
 * @param user - The unprepared user data containing email and username
 * @param db - Optional database instance, defaults to the main database instance
 * @returns Promise that resolves to null on success
 * @throws Error if user creation fails due to duplicate username or email
 */
const createUser = async (user: UnpreparedUser, db = dbInstance): Promise<null> => {
  const userHash = generateUserHash(user.email)
  const newUser: NewUser = {
    username: user.username,
    hash: userHash,
    verificationToken: null,
    verifiedAt: null,
  }

  try {
    await db.insert(users).values(newUser)

    return null
  } catch (error) {
    // Check if it's a unique constraint violation
    if (error instanceof Error && "cause" in error && error.cause) {
      const cause = error.cause as { code?: string; constraint?: string }

      // PostgreSQL unique constraint violation code
      if (cause.code === "23505") {
        if (cause.constraint === "users_username_unique") {
          throw new Error(`Username "${user.username}" is already taken`)
        }

        if (cause.constraint === "users_hash_unique") {
          throw new Error(`Email "${user.email}" is already registered`)
        }

        throw new Error("User already exists")
      }
    }

    throw error
  }
}

export { createUser }
