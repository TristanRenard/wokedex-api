import { serve } from "@hono/node-server"
import { config } from "dotenv"
import { Hono } from "hono"
import type { AuthenticatedContext } from "./middleware/auth.js"
import images from "./routes/images.js"
import login from "./routes/login.js"
import reindex, {
  authMiddleware as reindexAuthMiddleware,
} from "./routes/reindex.js"
import searchImages from "./routes/search-image.js"
import searchImagesDB from "./routes/searchDB-image.js"
import upload, { authMiddleware } from "./routes/upload.js"
import verify from "./routes/verify.js"

config()

const app = new Hono()

app.get("/", (c) => c.text("wokedex api is running"))

// POST /login
app.post("/login", async (c) => await login(c))

// POST /verify
app.post("/verify", async (c) => await verify(c))

// POST /upload (requires authentication)
app.post(
  "/upload",
  authMiddleware,
  async (c) => await upload(c as unknown as AuthenticatedContext),
)

// GET /search-images (public endpoint - Meilisearch)
app.get("/search-images", async (c) => await searchImages(c))

// GET /search-images-db (public endpoint - Database search)
app.get("/search-images-db", async (c) => await searchImagesDB(c))

// POST /reindex (requires admin authentication)
app.post(
  "/reindex",
  reindexAuthMiddleware,
  async (c) => await reindex(c as unknown as AuthenticatedContext),
)

// GET /images/:key (serve images from MinIO)
app.get("/images/:key", async (c) => await images(c))

serve({
  fetch: app.fetch,
  port: 3000,
})
