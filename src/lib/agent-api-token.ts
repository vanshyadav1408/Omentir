import { createHash } from "crypto";

export function hashAgentApiToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
