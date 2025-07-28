import { serve } from "@hono/node-server"
import { config } from "dotenv"
import { Hono } from "hono"
import login from "./routes/login.js"
import verify from "./routes/verify.js"

config()

const app = new Hono()

app.get("/", (c) => c.text("wokedex api is running"))

// POST /login
app.post("/login", async (c) => await login(c))

// POST /verify
app.post("/verify", async (c) => await verify(c))

serve({
  fetch: app.fetch,
  port: 3000,
})
