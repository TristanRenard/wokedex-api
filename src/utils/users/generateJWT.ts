import jwt from "jsonwebtoken"
import umami from "../../umami.js"

const generateJWT = async (hash: string): Promise<string> => {
  try {
    await umami.track("generate_jwt_started", {
      hasHash: hash ? "true" : "false",
    })

    const token = jwt.sign({ hash }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    })

    await umami.track("generate_jwt_completed")

    return token
  } catch (error) {
    await umami.track("generate_jwt_error", {
      error: error instanceof Error ? error.message : "unknown",
    })
    throw error
  }
}

export default generateJWT
