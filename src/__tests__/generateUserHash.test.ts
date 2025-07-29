import { describe, expect, it } from "vitest"
import { generateUserHash } from "../utils/users/generateUserHash.js"

describe("generateUserHash", () => {
  it("should generate consistent hash for same email", async () => {
    const email = "test@example.com"
    const hash1 = await generateUserHash(email)
    const hash2 = await generateUserHash(email)

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
  })

  it("should generate different hashes for different emails", async () => {
    const email1 = "user1@example.com"
    const email2 = "user2@example.com"
    const hash1 = await generateUserHash(email1)
    const hash2 = await generateUserHash(email2)

    expect(hash1).not.toBe(hash2)
  })

  it("should handle case insensitive emails", async () => {
    const emailLower = "test@example.com"
    const emailUpper = "TEST@EXAMPLE.COM"
    const emailMixed = "Test@Example.com"
    const hashLower = await generateUserHash(emailLower)
    const hashUpper = await generateUserHash(emailUpper)
    const hashMixed = await generateUserHash(emailMixed)

    expect(hashLower).toBe(hashUpper)
    expect(hashLower).toBe(hashMixed)
    expect(hashUpper).toBe(hashMixed)
  })

  it("should handle emails with leading and trailing whitespace", async () => {
    const emailClean = "test@example.com"
    const emailWithSpaces = "  test@example.com  "
    const emailWithTabs = "\ttest@example.com\t"
    const hashClean = await generateUserHash(emailClean)
    const hashWithSpaces = await generateUserHash(emailWithSpaces)
    const hashWithTabs = await generateUserHash(emailWithTabs)

    expect(hashClean).toBe(hashWithSpaces)
    expect(hashClean).toBe(hashWithTabs)
  })

  it("should generate valid SHA-256 hash format", async () => {
    const email = "test@example.com"
    const hash = await generateUserHash(email)

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should handle empty string", async () => {
    const hash = await generateUserHash("")

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should handle special characters in email", async () => {
    const emailWithSpecialChars = "test+tag@example.com"
    const hash = await generateUserHash(emailWithSpecialChars)

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should handle very long emails", async () => {
    const longEmail = `${"a".repeat(100)}@example.com`
    const hash = await generateUserHash(longEmail)

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("should generate deterministic hash for same input", async () => {
    const email = "user@domain.com"
    const expectedHash =
      "70b8780d2af3a42e6d5613df396bab396b4d3f3c17c477137d39dc6453d74807"
    const actualHash = await generateUserHash(email)

    expect(actualHash).toBe(expectedHash)
  })
})
