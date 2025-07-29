import type { EmailParams } from "../../types/email.js"

const parseEmail = (params: EmailParams, toParse: string): string =>
  params.reduce(
    (acc, param) => acc.replaceAll(`{{${param.key}}}`, param.value),
    toParse,
  )

export { parseEmail }
