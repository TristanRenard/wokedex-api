import { describe, expect, it } from "vitest"
import { generateUserHash } from "../utils/users/generateUserHash.js"

describe("generateUserHash", () => {
  it("should generate consistent hash for same email", () => {
    const email = "test@example.com"
    const hash1 = generateUserHash(email)
    const hash2 = generateUserHash(email)

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
  })

  it("should generate different hashes for different emails", () => {
    const email1 = "user1@example.com"
    const email2 = "user2@example.com"
    const hash1 = generateUserHash(email1)
    const hash2 = generateUserHash(email2)

    expect(hash1).not.toBe(hash2)
  })

  it("should handle case insensitive emails", () => {
    const emailLower = "test@example.com"
    const emailUpper = "TEST@EXAMPLE.COM"
    const emailMixed = "Test@Example.com"
    const hashLower = generateUserHash(emailLower)
    const hashUpper = generateUserHash(emailUpper)
    const hashMixed = generateUserHash(emailMixed)

    expect(hashLower).toBe(hashUpper)
    expect(hashLower).toBe(hashMixed)
    expect(hashUpper).toBe(hashMixed)
  })

  it("should handle emails with leading and trailing whitespace", () => {
    const emailClean = "test@example.com"
    const emailWithSpaces = "  test@example.com  "
    const emailWithTabs = "\ttest@example.com\t"
    const hashClean = generateUserHash(emailClean)
    const hashWithSpaces = generateUserHash(emailWithSpaces)
    const hashWithTabs = generateUserHash(emailWithTabs)

    expect(hashClean).toBe(hashWithSpaces)
    expect(hashClean).toBe(hashWithTabs)
  })

  it("should generate valid SHA-256 hash format", () => {
    const email = "test@example.com"
    const hash = generateUserHash(email)

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should handle empty string", () => {
    const hash = generateUserHash("")

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should handle special characters in email", () => {
    const emailWithSpecialChars = "test+tag@example.com"
    const hash = generateUserHash(emailWithSpecialChars)

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should handle very long emails", () => {
    const longEmail = `${"a".repeat(100)}@example.com`
    const hash = generateUserHash(longEmail)

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should generate deterministic hash for same input", () => {
    const email = "user@domain.com"
    const expectedHash = "70b8780d2af3a42e6d5613df396bab396b4d3f3c17c477137d39dc6453d74807"
    const actualHash = generateUserHash(email)

    expect(actualHash).toBe(expectedHash)
  })
}) 