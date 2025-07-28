import jwt from "jsonwebtoken"

const generateJWT = (hash: string): string => {
  const token = jwt.sign({ hash }, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  })

  return token
}

export default generateJWT
