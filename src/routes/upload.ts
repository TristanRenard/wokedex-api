import type { HandlerResponse } from "hono/types"
import uploadController from "../controllers/uploadController.js"
import {
  authMiddleware,
  type AuthenticatedContext,
} from "../middleware/auth.js"

const upload = async (
  c: AuthenticatedContext,
): Promise<HandlerResponse<number>> => await uploadController(c)

export { authMiddleware }
export default upload
