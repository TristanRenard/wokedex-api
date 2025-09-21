import { sql } from "drizzle-orm"
import { integer, json, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  hash: text("hash").notNull().unique(),
  verificationToken: text("verification_token"),
  verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
  role: integer("role").notNull().default(0),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
})

export const tags = pgTable("tags", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  user: text("user").references(() => users.id),
  keywords: text("keywords").array().notNull().default([]),
  style: json("style").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const images = pgTable("images", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  keywords: text("keywords").array().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const cards = pgTable("cards", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"),
  title: text("title"),
  level: integer("level").default(0),
  tag1: text("tag1").references(() => tags.id),
  tag2: text("tag2").references(() => tags.id),
  talent: text("talent"),
  object: text("object"),
  pv: integer("pv").default(0),
  acidity: integer("acidity").default(0),
  based: integer("based").default(0),
  da: integer("da").default(0),
  doom: integer("doom").default(0),
  competence1: text("competence1"),
  competence1Tag: text("competence1_tag").references(() => tags.id),
  competence2: text("competence2"),
  competence2Tag: text("competence2_tag").references(() => tags.id),
  competence3: text("competence3"),
  competence3Tag: text("competence3_tag").references(() => tags.id),
  competence4: text("competence4"),
  competence4Tag: text("competence4_tag").references(() => tags.id),
  degen: integer("degen").default(0),
  imageId: text("image_id").references(() => images.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  ownerId: text("owner_id").references(() => users.id),
})

export const cardReports = pgTable("card_reports", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  cardId: text("card_id")
    .references(() => cards.id)
    .notNull(),
  reporter: text("user_id").references(() => users.id),
  report: text("report").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const userReports = pgTable("user_reports", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  reporter: text("reporter").references(() => users.id),
  report: text("report").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
export type Image = typeof images.$inferSelect
export type NewImage = typeof images.$inferInsert
export type Card = typeof cards.$inferSelect
export type NewCard = typeof cards.$inferInsert
export type CardReport = typeof cardReports.$inferSelect
export type NewCardReport = typeof cardReports.$inferInsert
export type UserReport = typeof userReports.$inferSelect
export type NewUserReport = typeof userReports.$inferInsert

export interface TagWithAuthor {
  user: {
    id: string
    username: string | null
    hash: string
    verificationToken: string | null
    verificationTokenExpiresAt: Date | null
    role: number
    verifiedAt: Date | null
    createdAt: Date
    updatedAt: Date
    lastLogin: Date | null
  } | null
  tags: {
    id: string
    name: string
    user: string | null
    keywords: string[]
    style: unknown
    createdAt: Date
    updatedAt: Date
  }
}
