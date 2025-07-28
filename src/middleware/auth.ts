import type { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import jwt from "jsonwebtoken"
import type { User } from "../db/schema.js"
import getUserByHash from "../utils/users/getUserByHash.js"

export interface AuthenticatedContext extends Context {
  user: User
}

// eslint-disable-next-line consistent-return
export const authMiddleware = async (
  c: Context,
  next: Next,
): Promise<Response | void> => {
  try {
    const sessionToken = getCookie(c, "wokedexSession")

    if (!sessionToken) {
      return c.json({ message: "Session cookie required" }, 401)
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured")
    }

    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET) as {
      hash: string
    }
    const user = await getUserByHash(decoded.hash)

    if (!user) {
      return c.json({ message: "User not found" }, 401)
    }

    if (!user.verifiedAt) {
      return c.json({ message: "User not verified" }, 403)
    }

    ;(c as AuthenticatedContext).user = user

    await next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return c.json({ message: "Invalid session token" }, 401)
    }

    return c.json({ message: "Authentication failed" }, 500)
  }
}
