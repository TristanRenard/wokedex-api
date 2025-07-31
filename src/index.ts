import { serve } from "@hono/node-server"
import { config } from "dotenv"
import { Hono } from "hono"
import type { AuthenticatedContext } from "./middleware/auth.js"
import cards from "./routes/cards.js"
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

config()

const app = new Hono()

app.get("/", async (c) => {
  await umami.track("homepage_accessed")

  return c.text("wokedex api is running")
})

// POST /login
app.post("/login", async (c) => {
  await umami.track("login_attempt")

  return await login(c)
})

// POST /verify
app.post("/verify", async (c) => {
  await umami.track("verification_attempt")

  return await verify(c)
})

// POST /upload (requires authentication)
app.post("/upload", authMiddleware, async (c) => {
  await umami.track("upload_attempt")

  return await upload(c as unknown as AuthenticatedContext)
})

// GET /search-images (public endpoint - Meilisearch)
app.get("/search-images", async (c) => {
  await umami.track("search_images_meilisearch")

  return await searchImages(c)
})

// GET /search-images-db (public endpoint - Database search)
app.get("/search-images-db", async (c) => {
  await umami.track("search_images_database")

  return await searchImagesDB(c)
})

// GET /search-cards (public endpoint - Meilisearch)
app.route("/search-cards", searchCards)

// POST /reindex (requires admin authentication)
app.post("/reindex", reindexAuthMiddleware, async (c) => {
  await umami.track("reindex_attempt")

  return await reindex(c as unknown as AuthenticatedContext)
})

// GET /images/:key (serve images from MinIO)
app.get("/images/:key", async (c) => {
  await umami.track("image_served")

  return await images(c)
})

// Routes for tags
app.route("/tags", tags)

// Routes for cards
app.route("/cards", cards)

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (info) => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on http://localhost:${info.port}`)
    await umami.track("server_started")
  },
)
