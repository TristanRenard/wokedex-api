import type { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import jwt from "jsonwebtoken"
import type { User } from "../db/schema.js"
import umami from "../umami.js"
import getUserByHash from "../utils/users/getUserByHash.js"

export interface OptionalAuthContext extends Context {
  user?: User
}

export const optionalAuthMiddleware = async (
  c: Context,
  next: Next,
): Promise<void> => {
  try {
    await umami.track("optional_auth_middleware_started")

    const sessionToken = getCookie(c, "wokedexSession")

    if (!sessionToken) {
      await umami.track("optional_auth_middleware_no_session_token")
      await next()

      return
    }

    await umami.track("optional_auth_middleware_token_found")

    if (!process.env.JWT_SECRET) {
      await umami.track("optional_auth_middleware_jwt_secret_missing")
      await next()

      return
    }

    await umami.track("optional_auth_middleware_verifying_token")
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET) as {
      hash: string
    }
    await umami.track("optional_auth_middleware_token_verified")

    await umami.track("optional_auth_middleware_fetching_user")
    const user = await getUserByHash(decoded.hash)

    if (!user) {
      await umami.track("optional_auth_middleware_user_not_found")
      await next()

      return
    }

    await umami.track("optional_auth_middleware_user_found", {
      userId: user.id?.toString() ?? "unknown",
      userRole: user.role?.toString() ?? "unknown",
    })

    if (!user.verifiedAt) {
      await umami.track("optional_auth_middleware_user_not_verified", {
        userId: user.id?.toString() ?? "unknown",
      })
      await next()

      return
    }

    await umami.track("optional_auth_middleware_user_verified", {
      userId: user.id?.toString() ?? "unknown",
    })
    ;(c as OptionalAuthContext).user = user

    await umami.track("optional_auth_middleware_success", {
      userId: user.id?.toString() ?? "unknown",
    })

    await next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      await umami.track("optional_auth_middleware_invalid_token", {
        error: error.message,
      })
      await next()

      return
    }

    await umami.track("optional_auth_middleware_error", {
      error: error instanceof Error ? error.message : "unknown",
    })

    await next()
  }
}
