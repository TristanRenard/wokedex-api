type Hash = string
type VerificationToken = string

interface UnpreparedUser {
  username: string
  email: string
}


export type { Hash, UnpreparedUser, VerificationToken }

