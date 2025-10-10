import { eq } from "drizzle-orm"
import type { HandlerResponse } from "hono/types"
import { db } from "../db/index.js"
import { users } from "../db/schema.js"
import type { AuthenticatedContext } from "../middleware/auth.js"

const deleteAccount = async (
  c: AuthenticatedContext,
): Promise<HandlerResponse<number>> => {
  try {
    const { verificationToken } = await c.req.json()

    if (!verificationToken) {
      return c.json({ message: "invalid Token" }, 400)
    }

    const user = (
      await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, verificationToken))
    )?.[0]

    if (!user) {
      return c.json({ message: "invalid Token" }, 400)
    }

    if (
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt > new Date()
    ) {
      return c.json({ message: "expired Token" }, 400)
    }

    await db.delete(users).where(eq(users.verificationToken, verificationToken))

    return c.json({ message: "user-deleted" }, 200)
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error(error)

    return c.json({ message: (error as Error).message }, 500)
  }
}

export default deleteAccount
