import { db as dbInstance } from "../../db/index.js"

import { type NewUser, type User, users } from "../../db/schema.js"
import type { UnpreparedUser } from "../../types/user.js"
import umami from "../../umami.js"
import { generateUserHash } from "./generateUserHash.js"
import getUserByHash from "./getUserByHash.js"

/**
 * Create a new user in the database
 * @param user - The unprepared user data containing email and username
 * @param db - Optional database instance, defaults to the main database instance
 * @returns Promise that resolves to null on success
 * @throws Error if user creation fails due to duplicate username or email
 */
const createUser = async (
  user: UnpreparedUser,
  db = dbInstance,
): Promise<User> => {
  try {
    await umami.track("create_user_started", {
      hasUsername: user.username ? "true" : "false",
      hasEmail: user.email ? "true" : "false",
    })

    const userHash = await generateUserHash(user.email)
    await umami.track("create_user_hash_generated")

    const newUser: NewUser = {
      username: user.username,
      hash: userHash,
      verificationToken: null,
      verifiedAt: null,
    }

    await umami.track("create_user_inserting_to_db")
    await db.insert(users).values(newUser)
    await umami.track("create_user_inserted_to_db")

    const createdUser = await getUserByHash(userHash, db)
    await umami.track("create_user_success", {
      userId: createdUser?.id?.toString() || "unknown",
    })

    return createdUser
  } catch (error) {
    if (error instanceof Error && "cause" in error && error.cause) {
      const cause = error.cause as { code?: string; constraint?: string }

      if (cause.code === "23505") {
        if (cause.constraint === "users_username_unique") {
          await umami.track("create_user_duplicate_username", {
            username: user.username || "unknown",
          })
          throw new Error(`Username "${user.username}" is already taken`)
        }

        if (cause.constraint === "users_hash_unique") {
          await umami.track("create_user_duplicate_email", {
            email: user.email || "unknown",
          })
          throw new Error(`Email "${user.email}" is already registered`)
        }

        await umami.track("create_user_duplicate_user")
        throw new Error("User already exists")
      }
    }

    await umami.track("create_user_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export { createUser }
