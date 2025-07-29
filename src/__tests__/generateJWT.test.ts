/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import generateJWT from "../utils/users/generateJWT.js"

describe("generateJWT", () => {
  const originalJwtSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-key"
  })

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret
  })

  it("should generate valid JWT token", async () => {
    const hash = "test-hash-123"
    const token = await generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")
    expect(token.length).toBeGreaterThan(0)

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should generate different tokens for different hashes", async () => {
    const hash1 = "test-hash-123"
    const hash2 = "test-hash-456"
    const token1 = await generateJWT(hash1)
    const token2 = await generateJWT(hash2)

    expect(token1).not.toBe(token2)
    expect(typeof token1).toBe("string")
    expect(typeof token2).toBe("string")

    const decoded1 = jwt.verify(token1, process.env.JWT_SECRET as string) as any
    const decoded2 = jwt.verify(token2, process.env.JWT_SECRET as string) as any

    expect(decoded1.hash).toBe(hash1)
    expect(decoded2.hash).toBe(hash2)
  })

  it("should generate token with correct expiration", async () => {
    const hash = "test-hash-123"
    const token = await generateJWT(hash)
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
    expect(decoded.exp).toBeDefined()

    const now = Math.floor(Date.now() / 1000)
    const expectedExp = now + 60 * 60
    expect(decoded.exp).toBeGreaterThan(now)
    expect(decoded.exp).toBeLessThanOrEqual(expectedExp)
  })

  it("should handle empty hash", async () => {
    const token = await generateJWT("")

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe("")
  })

  it("should handle special characters in hash", async () => {
    const hash = "test-hash@#$%^&*()_+-=[]{}|;':\",./<>?"
    const token = await generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should handle very long hash", async () => {
    const hash = "a".repeat(1000)
    const token = await generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should handle unicode characters in hash", async () => {
    const hash = "test-hash-émojis🚀-unicode"
    const token = await generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should generate valid tokens for same hash", async () => {
    const hash = "test-hash-123"
    const token1 = await generateJWT(hash)
    const token2 = await generateJWT(hash)

    expect(typeof token1).toBe("string")
    expect(typeof token2).toBe("string")

    const decoded1 = jwt.verify(token1, process.env.JWT_SECRET as string) as any
    const decoded2 = jwt.verify(token2, process.env.JWT_SECRET as string) as any

    expect(decoded1.hash).toBe(hash)
    expect(decoded2.hash).toBe(hash)
  })

  it("should include iat (issued at) claim", async () => {
    const hash = "test-hash-123"
    const token = await generateJWT(hash)
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.iat).toBeDefined()
    expect(typeof decoded.iat).toBe("number")
    const now = Math.floor(Date.now() / 1000)
    expect(decoded.iat).toBeGreaterThan(now - 10)
    expect(decoded.iat).toBeLessThanOrEqual(now)
  })

  it("should throw error when JWT_SECRET is undefined", async () => {
    delete process.env.JWT_SECRET

    const hash = "test-hash-123"
    await expect(generateJWT(hash)).rejects.toThrow()
  })
})
