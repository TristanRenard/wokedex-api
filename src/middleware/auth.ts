import type { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import jwt from "jsonwebtoken"
import type { User } from "../db/schema.js"
import umami from "../umami.js"
import getUserByHash from "../utils/users/getUserByHash.js"

export interface AuthenticatedContext extends Context {
  user: User
}

export const authMiddleware = async (
  c: Context,
  next: Next,
  // eslint-disable-next-line consistent-return
): Promise<Response | void> => {
  try {
    await umami.track("auth_middleware_started")

    const sessionToken = getCookie(c, "wokedexSession")

    if (!sessionToken) {
      await umami.track("auth_middleware_no_session_token")

      return c.json({ message: "Session cookie required" }, 401)
    }

    await umami.track("auth_middleware_token_found")

    if (!process.env.JWT_SECRET) {
      await umami.track("auth_middleware_jwt_secret_missing")
      throw new Error("JWT_SECRET not configured")
    }

    await umami.track("auth_middleware_verifying_token")
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET) as {
      hash: string
    }
    await umami.track("auth_middleware_token_verified")

    await umami.track("auth_middleware_fetching_user")
    const user = await getUserByHash(decoded.hash)

    if (!user) {
      await umami.track("auth_middleware_user_not_found")

      return c.json({ message: "User not found" }, 401)
    }

    await umami.track("auth_middleware_user_found", {
      userId: user.id?.toString() ?? "unknown",
      userRole: user.role?.toString() ?? "unknown",
    })

    if (!user.verifiedAt) {
      await umami.track("auth_middleware_user_not_verified", {
        userId: user.id?.toString() ?? "unknown",
      })

      return c.json({ message: "User not verified" }, 403)
    }

    await umami.track("auth_middleware_user_verified", {
      userId: user.id?.toString() ?? "unknown",
    })
    ;(c as AuthenticatedContext).user = user

    await umami.track("auth_middleware_success", {
      userId: user.id?.toString() ?? "unknown",
    })

    await next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      await umami.track("auth_middleware_invalid_token", {
        error: error.message,
      })

      return c.json({ message: "Invalid session token" }, 401)
    }

    await umami.track("auth_middleware_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    return c.json({ message: "Authentication failed" }, 500)
  }
}
