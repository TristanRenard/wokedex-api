import type { Context } from "hono"
import { setCookie, setSignedCookie } from "hono/cookie"
import type { HandlerResponse } from "hono/types"
import verifyController from "../controllers/verifyController.js"

const verify = async (c: Context): Promise<HandlerResponse<number>> => {
  const { username, verificationToken } = await c.req.json()

  if (!verificationToken) {
    return c.json({ message: "email is required" }, 400)
  }

  try {
    const jwt = await verifyController(username, verificationToken)
    const isDev = process.env.NODE_ENV === "development"

    if (isDev) {
      setCookie(c, "wokedexSession", jwt, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 864000,
        path: "/",
      })
    } else {
      await setSignedCookie(
        c,
        "wokedexSession",
        jwt,
        process.env.SECRET as string,
        {
          httpOnly: true,
          secure: true,
          maxAge: 864000,
          sameSite: "lax",
          domain: process.env.DOMAIN,
        },
      )
    }

    return c.json({ message: "email sent" }, 200)
  } catch (error: unknown) {
    return c.json({ message: (error as Error).message }, 500)
  }
}

export default verify
