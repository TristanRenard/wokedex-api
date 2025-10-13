import { Hono } from "hono"
import { createServer } from "http"
import type { AuthenticatedContext } from "./middleware/auth.js"
import {
  optionalAuthMiddleware,
  type OptionalAuthContext,
} from "./middleware/optionalAuth.js"
import cards from "./routes/cards.js"
import deleteAccount from "./routes/delete-account.js"
import images from "./routes/images.js"
import login from "./routes/login.js"
import reindex, {
  authMiddleware as reindexAuthMiddleware,
} from "./routes/reindex.js"
import searchCards from "./routes/search-cards.js"
import searchImages from "./routes/search-image.js"
import searchImagesDB from "./routes/searchDB-image.js"
import tags from "./routes/tags.js"
import upload, { authMiddleware } from "./routes/upload.js"
import verify from "./routes/verify.js"
import umami from "./umami.js"

const app = new Hono()

// Middleware CORS
// eslint-disable-next-line consistent-return
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") ?? ""

  c.res.headers.set("Access-Control-Allow-Origin", origin)
  c.res.headers.set("Vary", "Origin")

  c.res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  )
  c.res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key",
  )
  c.res.headers.set("Access-Control-Allow-Credentials", "true")

  if (c.req.method === "OPTIONS") {
    return c.text("", 200)
  }

  await next()
})

// Routes
app.get("/", async (c) => {
  await umami.track("homepage_accessed")

  return c.text("wokedex api is running")
})

app.post("/login", async (c) => {
  await umami.track("login_attempt")

  return login(c)
})

app.post("/verify", async (c) => {
  await umami.track("verification_attempt")

  return verify(c)
})

app.post("/delete", authMiddleware, async (c) => {
  await umami.track("DeleteAccount_attempt")

  return deleteAccount(c as unknown as AuthenticatedContext)
})

//@ts-expect-error upload
app.post("/upload", authMiddleware, async (c: AuthenticatedContext) => {
  await umami.track("upload_attempt")

  return upload(c)
})

app.get("/search-images", async (c) => {
  await umami.track("search_images_meilisearch")

  return searchImages(c)
})

app.get("/search-images-db", async (c) => {
  await umami.track("search_images_database")

  return searchImagesDB(c)
})

app.route("/search-cards", searchCards)

//@ts-expect-error reindex
app.post("/reindex", reindexAuthMiddleware, async (c: AuthenticatedContext) => {
  await umami.track("reindex_attempt")

  return reindex(c)
})

app.get("/images/:key", async (c) => {
  await umami.track("image_served")

  return images(c)
})

app.route("/tags", tags)
app.route("/cards", cards)

app.get("/@me", optionalAuthMiddleware, (c: OptionalAuthContext) =>
  c.json({ user: c?.user }),
)

// Serveur HTTP
const server = createServer((req, res) => {
  ;(async () => {
    let body: Buffer | null = null

    if (req.method && req.method !== "GET" && req.method !== "HEAD") {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(chunk as Buffer)
      }
      body = Buffer.concat(chunks)
    }

    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers[key] = value
      } else if (Array.isArray(value)) {
        headers[key] = value.join(", ")
      }
    }

    const response = await app.fetch(
      new Request(`http://localhost:3000${req.url ?? ""}`, {
        method: req.method,
        headers,
        //@ts-expect-error bodyType
        body: body ?? undefined,
      }),
    )

    for (const [key, value] of response.headers) {
      res.setHeader(key, value)
    }

    res.statusCode = response.status
    const responseBody = await response.arrayBuffer()
    res.end(Buffer.from(responseBody))
  })().catch((err) => {
    res.statusCode = 500
    res.end(
      `Internal Server Error: ${err instanceof Error ? err.message : String(err)}`,
    )
  })
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
server.listen(3000, async () => {
  // eslint-disable-next-line no-console
  console.log("API running on http://localhost:3000")
  await umami.track("server_started")
})
