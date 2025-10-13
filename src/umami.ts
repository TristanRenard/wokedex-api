/* eslint-disable no-console */
import { Umami } from "@umami/node"

const isUmamiConfigured =
  process.env.UMAMI_WEBSITE_ID && process.env.UMAMI_HOSTURL

class UmamiWithHostname extends Umami {
  private systemHostname: string

  constructor(config: { websiteId: string; hostUrl: string }) {
    super(config)
    this.systemHostname = process.env.HOST_NAME as string
  }

  // eslint-disable-next-line no-restricted-syntax
  async track(
    eventName: string,
    data?: Record<string, string | number | Date>,
  ): Promise<Response> {
    return super.track(eventName, {
      ...data,
      hostname: this.systemHostname,
    })
  }
}

const umami = isUmamiConfigured
  ? new UmamiWithHostname({
      websiteId: process.env.UMAMI_WEBSITE_ID as string,
      hostUrl: process.env.UMAMI_HOSTURL as string,
    })
  : null

console.log(umami)

const track = async (
  eventName: string,
  data?: Record<string, string | number | Date>,
): Promise<void> => {
  if (!umami) {
    return
  }

  try {
    await umami.track(eventName, data)
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Umami Debug] Tracking failed for ${eventName}:`, {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        data,
      })
    }
  }
}

export default { track }
