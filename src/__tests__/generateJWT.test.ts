/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import generateJWT from "../utils/users/generateJWT.js"

describe("generateJWT", () => {
  const originalJwtSecret = process.env.JWT_SECRET

  beforeEach(() => {
    // Set up JWT_SECRET for tests
    process.env.JWT_SECRET = "test-secret-key"
  })

  afterEach(() => {
    // Restore original JWT_SECRET
    process.env.JWT_SECRET = originalJwtSecret
  })

  it("should generate valid JWT token", () => {
    const hash = "test-hash-123"
    const token = generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")
    expect(token.length).toBeGreaterThan(0)

    // Verify the token can be decoded
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should generate different tokens for different hashes", () => {
    const hash1 = "test-hash-123"
    const hash2 = "test-hash-456"
    const token1 = generateJWT(hash1)
    const token2 = generateJWT(hash2)

    expect(token1).not.toBe(token2)
    expect(typeof token1).toBe("string")
    expect(typeof token2).toBe("string")

    // Verify both tokens are valid
    const decoded1 = jwt.verify(token1, process.env.JWT_SECRET as string) as any
    const decoded2 = jwt.verify(token2, process.env.JWT_SECRET as string) as any

    expect(decoded1.hash).toBe(hash1)
    expect(decoded2.hash).toBe(hash2)
  })

  it("should generate token with correct expiration", () => {
    const hash = "test-hash-123"
    const token = generateJWT(hash)
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
    expect(decoded.exp).toBeDefined()

    // Check that expiration is set to 1 hour from now (with some tolerance)
    const now = Math.floor(Date.now() / 1000)
    // 1 hour
    const expectedExp = now + 60 * 60
    expect(decoded.exp).toBeGreaterThan(now)
    expect(decoded.exp).toBeLessThanOrEqual(expectedExp)
  })

  it("should handle empty hash", () => {
    const token = generateJWT("")

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe("")
  })

  it("should handle special characters in hash", () => {
    const hash = "test-hash@#$%^&*()_+-=[]{}|;':\",./<>?"
    const token = generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should handle very long hash", () => {
    const hash = "a".repeat(1000)
    const token = generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should handle unicode characters in hash", () => {
    const hash = "test-hash-émojis🚀-unicode"
    const token = generateJWT(hash)

    expect(token).toBeDefined()
    expect(typeof token).toBe("string")

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.hash).toBe(hash)
  })

  it("should generate valid tokens for same hash", () => {
    const hash = "test-hash-123"
    const token1 = generateJWT(hash)
    const token2 = generateJWT(hash)

    // Both tokens should be valid
    expect(typeof token1).toBe("string")
    expect(typeof token2).toBe("string")

    const decoded1 = jwt.verify(token1, process.env.JWT_SECRET as string) as any
    const decoded2 = jwt.verify(token2, process.env.JWT_SECRET as string) as any

    expect(decoded1.hash).toBe(hash)
    expect(decoded2.hash).toBe(hash)
  })

  it("should include iat (issued at) claim", () => {
    const hash = "test-hash-123"
    const token = generateJWT(hash)
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any
    expect(decoded.iat).toBeDefined()
    expect(typeof decoded.iat).toBe("number")

    // Check that iat is close to current time
    const now = Math.floor(Date.now() / 1000)
    // Within 10 seconds
    expect(decoded.iat).toBeGreaterThan(now - 10)
    expect(decoded.iat).toBeLessThanOrEqual(now)
  })

  it("should throw error when JWT_SECRET is undefined", () => {
    delete process.env.JWT_SECRET

    const hash = "test-hash-123"
    expect(() => generateJWT(hash)).toThrow()
  })
})
