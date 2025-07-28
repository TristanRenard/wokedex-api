import { db as dbInstance } from "../db/index.js"
import type { UnpreparedUser } from "../types/user.js"
import createToken from "../utils/users/createToken.js"
import { createUser } from "../utils/users/createUser.js"
import { generateUserHash } from "../utils/users/generateUserHash.js"
import getUserByHash from "../utils/users/getUserByHash.js"

const loginController = async (
  { email, username }: UnpreparedUser,
  db = dbInstance,
): Promise<string | void> => {
  const userHash = generateUserHash(email)
  const user =
    (await getUserByHash(userHash, db)) ??
    (await createUser({ email, username }, db))

  if (user) {
    const { verificationToken } = await createToken(user.hash, db)

    return verificationToken
  }

  return undefined
}

export default loginController
