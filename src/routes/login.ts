import type { Context } from "hono"
import type { HandlerResponse } from "hono/types"
import loginController from "../controllers/loginController.js"

const login = async (c: Context): Promise<HandlerResponse<number>> => {
  const { email, username } = await c.req.json()

  if (!email) {
    return c.json({ message: "email is required" }, 400)
  }

  await loginController({ email, username })

  if (process.env.NODE_ENV === "development") {
    return c.json({ message: "email sent" })
  }

  return c.json({ message: "email sent" })
}

export default login
