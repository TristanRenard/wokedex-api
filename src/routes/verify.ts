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

    if (process.env.NODE_ENV === "development") {
      setCookie(c, "wokedexSession", jwt, {
        httpOnly: true,
        secure: false,
        maxAge: 864000,
        sameSite: "strict",
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
          sameSite: "strict",
        },
      )
    }

    return c.json({ message: "email sent", jwt }, 200)
  } catch (error: unknown) {
    return c.json({ message: (error as Error).message }, 500)
  }
}

export default verify
